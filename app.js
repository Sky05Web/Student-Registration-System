// Student Registration System

// Handle localStorage operations
class LocalStorageManager {
    constructor(key = 'studentRecords') {
        this.key = key;
    }

    getStudents() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    saveStudents(students) {
        try {
            localStorage.setItem(this.key, JSON.stringify(students));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    addStudent(student) {
        const students = this.getStudents();
        students.push(student);
        this.saveStudents(students);
    }

    updateStudent(studentId, updatedStudent) {
        const students = this.getStudents();
        const index = students.findIndex(s => s.studentId === studentId);
        if (index !== -1) {
            students[index] = updatedStudent;
            this.saveStudents(students);
        }
    }

    deleteStudent(studentId) {
        const students = this.getStudents();
        const filteredStudents = students.filter(s => s.studentId !== studentId);
        this.saveStudents(filteredStudents);
    }

    studentIdExists(studentId, excludeId = null) {
        const students = this.getStudents();
        return students.some(s => s.studentId === studentId && s.studentId !== excludeId);
    }
}


// Input validation logic
class ValidationManager {
    static validateName(name) {
        const namePattern = /^[a-zA-Z\s]+$/;
        if (!name.trim()) {
            return { valid: false, message: 'Student name is required' };
        }
        if (!namePattern.test(name.trim())) {
            return { valid: false, message: 'Name should contain only letters and spaces' };
        }
        if (name.trim().length < 2) {
            return { valid: false, message: 'Name must be at least 2 characters' };
        }
        return { valid: true, message: '' };
    }

    static validateStudentId(studentId, checkDuplicate = false, excludeId = null) {
        const idPattern = /^\d+$/;
        if (!studentId.trim()) {
            return { valid: false, message: 'Student ID is required' };
        }
        if (!idPattern.test(studentId.trim())) {
            return { valid: false, message: 'Student ID must be numbers only' };
        }
        if (checkDuplicate && storageManager.studentIdExists(studentId.trim(), excludeId)) {
            return { valid: false, message: 'This Student ID already exists' };
        }
        return { valid: true, message: '' };
    }

    static validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            return { valid: false, message: 'Email is required' };
        }
        if (!emailPattern.test(email.trim())) {
            return { valid: false, message: 'Please enter a valid email' };
        }
        return { valid: true, message: '' };
    }

    static validateContact(contact) {
        const contactPattern = /^\d{10,}$/;
        if (!contact.trim()) {
            return { valid: false, message: 'Contact number is required' };
        }
        if (!contactPattern.test(contact.trim())) {
            return { valid: false, message: 'Contact must have at least 10 digits' };
        }
        return { valid: true, message: '' };
    }

    static validateAllFields(formData, checkDuplicate = false, excludeId = null) {
        const errors = {};

        const nameVal = this.validateName(formData.name);
        if (!nameVal.valid) errors.name = nameVal.message;

        const idVal = this.validateStudentId(formData.studentId, checkDuplicate, excludeId);
        if (!idVal.valid) errors.studentId = idVal.message;

        const emailVal = this.validateEmail(formData.email);
        if (!emailVal.valid) errors.email = emailVal.message;

        const contactVal = this.validateContact(formData.contact);
        if (!contactVal.valid) errors.contact = contactVal.message;

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }
}


// Handle DOM updates and display
class DOMManager {
    static displayErrors(errors, formType = 'register') {
        const fieldMap = {
            register: {
                name: 'nameError',
                studentId: 'idError',
                email: 'emailError',
                contact: 'contactError'
            },
            edit: {
                name: 'editNameError',
                studentId: 'editIdError',
                email: 'editEmailError',
                contact: 'editContactError'
            }
        };

        const errorMap = fieldMap[formType];

        // Clear all errors first
        Object.values(errorMap).forEach(errorId => {
            const el = document.getElementById(errorId);
            if (el) {
                el.classList.remove('show');
                el.textContent = '';
            }
        });

        // Show new errors
        Object.keys(errors).forEach(field => {
            const errorId = errorMap[field];
            const el = document.getElementById(errorId);
            if (el) {
                el.textContent = errors[field];
                el.classList.add('show');
            }
        });
    }

    static clearErrors(formType = 'register') {
        const errorIds = formType === 'register'
            ? ['nameError', 'idError', 'emailError', 'contactError']
            : ['editNameError', 'editIdError', 'editEmailError', 'editContactError'];

        errorIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('show');
                el.textContent = '';
            }
        });
    }

    static displaySuccess(message) {
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.add('show');
            setTimeout(() => {
                successDiv.classList.remove('show');
            }, 3000);
        }
    }

    static renderStudents() {
        const students = storageManager.getStudents();
        const tableBody = document.getElementById('studentsTableBody');
        const noMsg = document.getElementById('noStudentsMessage');
        const tableContainer = document.getElementById('tableContainer');

        tableBody.innerHTML = '';

        if (students.length === 0) {
            noMsg.classList.remove('hide');
            tableContainer.style.display = 'none';
        } else {
            noMsg.classList.add('hide');
            tableContainer.style.display = 'block';

            students.forEach(student => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.escapeHtml(student.name)}</td>
                    <td>${this.escapeHtml(student.studentId)}</td>
                    <td>${this.escapeHtml(student.email)}</td>
                    <td>${this.escapeHtml(student.contact)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-edit" onclick="app.openEditModal('${student.studentId}')">Edit</button>
                            <button class="btn btn-delete" onclick="app.deleteStudent('${student.studentId}')">Delete</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            this.updateScrollbar();
        }
    }

    static updateScrollbar() {
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer) {
            const hasScroll = tableContainer.scrollHeight > tableContainer.clientHeight;
            tableContainer.style.overflowY = hasScroll ? 'scroll' : 'auto';
        }
    }

    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, char => map[char]);
    }
}

// Main app
class StudentRegistrationApp {
    constructor() {
        this.storageManager = new LocalStorageManager();
        this.validationManager = ValidationManager;
        this.domManager = DOMManager;
        this.editingStudentId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.domManager.renderStudents();
    }

    setupEventListeners() {
        // Form submission
        const studentForm = document.getElementById('studentForm');
        if (studentForm) {
            studentForm.addEventListener('submit', (e) => this.handleAddStudent(e));
        }

        // Edit form
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditStudent(e));
        }

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Close modal on background click
        const modal = document.getElementById('editModal');
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Clear errors on input
        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('input', () => {
                this.domManager.clearErrors('register');
            });
        });

        // Clear errors on edit form
        document.querySelectorAll('#editForm .form-input').forEach(input => {
            input.addEventListener('input', () => {
                this.domManager.clearErrors('edit');
            });
        });
    }

    handleAddStudent(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById('studentName').value,
            studentId: document.getElementById('studentId').value,
            email: document.getElementById('email').value,
            contact: document.getElementById('contactNumber').value
        };

        const validation = this.validationManager.validateAllFields(formData, true);

        if (!validation.isValid) {
            this.domManager.displayErrors(validation.errors, 'register');
            return;
        }

        this.domManager.clearErrors('register');

        const student = {
            name: formData.name.trim(),
            studentId: formData.studentId.trim(),
            email: formData.email.trim().toLowerCase(),
            contact: formData.contact.trim()
        };

        this.storageManager.addStudent(student);
        this.domManager.displaySuccess(`✓ Student "${student.name}" registered successfully!`);
        this.domManager.renderStudents();
        event.target.reset();
    }

    openEditModal(studentId) {
        const students = this.storageManager.getStudents();
        const student = students.find(s => s.studentId === studentId);

        if (!student) {
            alert('Student not found');
            return;
        }

        document.getElementById('editName').value = student.name;
        document.getElementById('editId').value = student.studentId;
        document.getElementById('editEmail').value = student.email;
        document.getElementById('editContact').value = student.contact;

        this.editingStudentId = studentId;
        document.getElementById('editModal').classList.add('show');
        this.domManager.clearErrors('edit');
    }

    closeModal() {
        document.getElementById('editModal').classList.remove('show');
        this.editingStudentId = null;
        this.domManager.clearErrors('edit');
    }

    handleEditStudent(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById('editName').value,
            studentId: document.getElementById('editId').value,
            email: document.getElementById('editEmail').value,
            contact: document.getElementById('editContact').value
        };

        const validation = this.validationManager.validateAllFields(formData, false);

        if (!validation.isValid) {
            this.domManager.displayErrors(validation.errors, 'edit');
            return;
        }

        this.domManager.clearErrors('edit');

        const updatedStudent = {
            name: formData.name.trim(),
            studentId: formData.studentId.trim(),
            email: formData.email.trim().toLowerCase(),
            contact: formData.contact.trim()
        };

        this.storageManager.updateStudent(this.editingStudentId, updatedStudent);
        this.domManager.displaySuccess(`✓ Student record updated!`);
        this.domManager.renderStudents();
        this.closeModal();
    }

    deleteStudent(studentId) {
        const students = this.storageManager.getStudents();
        const student = students.find(s => s.studentId === studentId);

        if (!student) {
            alert('Student not found');
            return;
        }

        if (confirm(`Delete ${student.name}'s record? This cannot be undone.`)) {
            this.storageManager.deleteStudent(studentId);
            this.domManager.displaySuccess(`✓ Student record deleted!`);
            this.domManager.renderStudents();
        }
    }
}

// Initialize on page load
let storageManager;
let app;

document.addEventListener('DOMContentLoaded', () => {
    storageManager = new LocalStorageManager();
    app = new StudentRegistrationApp();
});
