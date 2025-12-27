// Initialize app variables
let bookings = [];
let isAdminLoggedIn = false;

// Load bookings from localStorage
function loadBookings() {
    try {
        const stored = localStorage.getItem('sunlodge_bookings');
        if (stored) {
            bookings = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookings = [];
    }
}

// Save bookings to localStorage
function saveBookings() {
    try {
        localStorage.setItem('sunlodge_bookings', JSON.stringify(bookings));
    } catch (error) {
        console.error('Error saving bookings:', error);
    }
}

// Initialize dates for booking form
function initializeDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const checkInInput = document.getElementById('check-in');
    const checkOutInput = document.getElementById('check-out');
    
    if (checkInInput && checkOutInput) {
        checkInInput.min = todayStr;
        checkInInput.value = todayStr;
        checkOutInput.min = tomorrowStr;
        checkOutInput.value = tomorrowStr;
    }
}

// Page navigation function
function showPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(pageName + '-page');
    if (selectedPage) {
        selectedPage.classList.add('active');
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Initialize booking dates if on booking page
        if (pageName === 'booking') {
            initializeDates();
        }
        
        // Handle admin page
        if (pageName === 'admin') {
            if (isAdminLoggedIn) {
                document.getElementById('admin-login').classList.add('hidden');
                document.getElementById('admin-dashboard').classList.remove('hidden');
                updateDashboard();
            } else {
                document.getElementById('admin-login').classList.remove('hidden');
                document.getElementById('admin-dashboard').classList.add('hidden');
            }
        }
    }
}

// Book room from rooms page
function bookRoom(roomType, price) {
    showPage('booking');
    setTimeout(() => {
        const roomSelect = document.getElementById('room-type');
        if (roomSelect) {
            roomSelect.value = roomType + '|' + price;
        }
    }, 100);
}

// Check if room is available for given dates
function isRoomAvailable(roomType, checkIn, checkOut) {
    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);
    
    for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        if (booking.roomType !== roomType) continue;
        
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        
        // Check for date overlap
        if (newCheckIn < bookingCheckOut && newCheckOut > bookingCheckIn) {
            return false;
        }
    }
    return true;
}

// Submit booking form
function submitBooking(event) {
    event.preventDefault();
    
    try {
        const roomData = document.getElementById('room-type').value.split('|');
        const roomType = roomData[0];
        const checkIn = document.getElementById('check-in').value;
        const checkOut = document.getElementById('check-out').value;
        const guestName = document.getElementById('guest-name').value;
        const guestPhone = document.getElementById('guest-phone').value;
        const guestEmail = document.getElementById('guest-email').value;
        
        // Validate dates
        if (new Date(checkOut) <= new Date(checkIn)) {
            showAlert('booking-alert', 'Check-out date must be after check-in date', 'error');
            return false;
        }
        
        // Check availability
        if (!isRoomAvailable(roomType, checkIn, checkOut)) {
            showAlert('booking-alert', 'Sorry, this room is not available for the selected dates. Please choose different dates.', 'error');
            return false;
        }
        
        // Create booking
        const booking = {
            id: Date.now(),
            roomType: roomType,
            checkIn: checkIn,
            checkOut: checkOut,
            guestName: guestName,
            guestPhone: guestPhone,
            guestEmail: guestEmail,
            status: 'Booked',
            bookingDate: new Date().toISOString()
        };
        
        bookings.push(booking);
        saveBookings();
        
        showAlert('booking-alert', 'Booking confirmed! Thank you for choosing Sunlodge Hotel. We look forward to hosting you.', 'success');
        document.getElementById('booking-form').reset();
        initializeDates();
        
    } catch (error) {
        console.error('Booking error:', error);
        showAlert('booking-alert', 'An error occurred. Please try again.', 'error');
    }
    
    return false;
}

// Admin login
function adminLogin(event) {
    event.preventDefault();
    
    try {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username === 'admin' && password === 'admin123') {
            isAdminLoggedIn = true;
            document.getElementById('admin-login').classList.add('hidden');
            document.getElementById('admin-dashboard').classList.remove('hidden');
            updateDashboard();
        } else {
            showAlert('login-alert', 'Invalid username or password. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('login-alert', 'An error occurred. Please try again.', 'error');
    }
    
    return false;
}

// Admin logout
function adminLogout() {
    isAdminLoggedIn = false;
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
    document.getElementById('login-form').reset();
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Update admin dashboard
function updateDashboard() {
    try {
        const totalRooms = 3;
        const today = new Date().toISOString().split('T')[0];
        
        // Count active bookings
        const activeBookings = bookings.filter(b => new Date(b.checkOut) >= new Date(today));
        const bookedRooms = activeBookings.length;
        const availableRooms = totalRooms - bookedRooms;
        const todayCheckins = bookings.filter(b => b.checkIn === today).length;
        
        // Update stats
        document.getElementById('total-rooms').textContent = totalRooms;
        document.getElementById('available-rooms').textContent = availableRooms >= 0 ? availableRooms : 0;
        document.getElementById('booked-rooms').textContent = bookedRooms;
        document.getElementById('today-checkins').textContent = todayCheckins;
        
        // Update bookings table
        const tbody = document.getElementById('bookings-tbody');
        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No bookings yet</td></tr>';
        } else {
            let tableHTML = '';
            for (let i = 0; i < bookings.length; i++) {
                const booking = bookings[i];
                tableHTML += '<tr>';
                tableHTML += '<td>' + booking.guestName + '</td>';
                tableHTML += '<td>' + booking.roomType + '</td>';
                tableHTML += '<td>' + booking.checkIn + '</td>';
                tableHTML += '<td>' + booking.checkOut + '</td>';
                tableHTML += '<td>' + booking.guestPhone + '</td>';
                tableHTML += '<td><span class="status-badge status-booked">' + booking.status + '</span></td>';
                tableHTML += '</tr>';
            }
            tbody.innerHTML = tableHTML;
        }
    } catch (error) {
        console.error('Dashboard update error:', error);
    }
}

// Show alert message
function showAlert(elementId, message, type) {
    try {
        const alert = document.getElementById(elementId);
        if (alert) {
            alert.className = 'alert alert-' + type;
            alert.textContent = message;
            alert.style.display = 'block';
            
            setTimeout(function() {
                alert.style.display = 'none';
            }, 5000);
        }
    } catch (error) {
        console.error('Alert error:', error);
    }
}

// Initialize app when page loads
window.onload = function() {
    loadBookings();
    initializeDates();
};