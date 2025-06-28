// Global variables
let students = [];
let attendanceData = {};
let currentClassroom = '';
let tempImportData = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    loadSavedData();
    
    // โหลด URL ของ Google Sheets ที่บันทึกไว้
    const savedUrl = localStorage.getItem('outputSheetUrl');
    if (savedUrl) {
        document.getElementById('outputSheetUrl').value = savedUrl;
    }
    
    // บันทึก URL เมื่อมีการเปลี่ยนแปลง
    document.getElementById('outputSheetUrl').addEventListener('change', saveOutputSheetUrl);
});

// Update current date
function updateCurrentDate() {
    const date = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('th-TH', options);
    document.getElementById('reportDate').value = date.toISOString().split('T')[0];
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Update attendance info when switching to attendance tab
    if (tabName === 'attendance') {
        updateAttendanceInfo();
    }
}

// Load saved data from localStorage
function loadSavedData() {
    const savedStudents = localStorage.getItem('students');
    const savedAttendance = localStorage.getItem('attendanceData');
    
    if (savedStudents) {
        students = JSON.parse(savedStudents);
    }
    
    if (savedAttendance) {
        attendanceData = JSON.parse(savedAttendance);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
}

// Load students for selected classroom
function loadStudents() {
    const classroom = document.getElementById('classSelect').value;
    currentClassroom = classroom;
    
    if (!classroom) return;

    const classStudents = students.filter(s => s.classroom === classroom);
    displayStudents(classStudents);
}

// Display students in attendance grid
function displayStudents(studentList) {
    const grid = document.getElementById('attendanceGrid');
    grid.innerHTML = '';

    studentList.forEach(student => {
        const card = document.createElement('div');
        card.className = `student-card ${student.status || 'present'}`;
        card.innerHTML = `
            <div class="student-name">${student.name}</div>
            <div class="student-id">รหัส: ${student.id}</div>
            <div class="status-buttons">
                <button class="status-btn ${student.status === 'present' ? 'active' : ''}" 
                        onclick="setStatus('${student.id}', 'present')" style="background: #28a745; color: white;">
                    มา
                </button>
                <button class="status-btn ${student.status === 'absent' ? 'active' : ''}" 
                        onclick="setStatus('${student.id}', 'absent')" style="background: #dc3545; color: white;">
                    ขาด
                </button>
                <button class="status-btn ${student.status === 'sick' ? 'active' : ''}" 
                        onclick="setStatus('${student.id}', 'sick')" style="background: #ffc107; color: #333;">
                    ป่วย
                </button>
                <button class="status-btn ${student.status === 'activity' ? 'active' : ''}" 
                        onclick="setStatus('${student.id}', 'activity')" style="background: #17a2b8; color: white;">
                    กิจกรรม
                </button>
                <button class="status-btn ${student.status === 'home' ? 'active' : ''}" 
                        onclick="setStatus('${student.id}', 'home')" style="background: #6c757d; color: white;">
                    กลับบ้าน
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    updateSummary();
}

// Set student status
function setStatus(studentId, status) {
    const student = students.find(s => s.id === studentId && s.classroom === currentClassroom);
    if (student) {
        student.status = status;
        saveData();
        loadStudents();
    }
}

// Update attendance summary
function updateSummary() {
    const classStudents = students.filter(s => s.classroom === currentClassroom);
    
    const counts = {
        present: 0,
        absent: 0,
        sick: 0,
        activity: 0,
        home: 0
    };

    classStudents.forEach(student => {
        counts[student.status || 'present']++;
    });

    document.getElementById('presentCount').textContent = counts.present;
    document.getElementById('absentCount').textContent = counts.absent;
    document.getElementById('sickCount').textContent = counts.sick;
    document.getElementById('activityCount').textContent = counts.activity;
    document.getElementById('homeCount').textContent = counts.home;
}

// Update attendance info
function updateAttendanceInfo() {
    const classSelect = document.getElementById('classSelect').value;
    const classText = {
        'com-sec-1': '📱 สื่อสารตอน 1',
        'com-sec-2': '📱 สื่อสารตอน 2',
        'com-sec-3': '📱 สื่อสารตอน 3',
        'com-comp': '💻 สื่อสารคอม'
    };
    document.getElementById('currentClass').textContent = 
        classText[classSelect] || '-';
    document.getElementById('currentTeacher').textContent = 
        document.getElementById('teacherName').value || '-';
    
    const timeSlot = document.getElementById('timeSlot').value;
    const timeSlotText = {
        'morning': '🌅 ภาคเช้า',
        'afternoon': '☀️ ภาคบ่าย'
    };
    document.getElementById('currentTimeSlot').textContent = 
        timeSlotText[timeSlot] || '-';
}

// Save attendance
function saveAttendance() {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('th-TH');
    const teacher = document.getElementById('teacherName').value;
    const timeSlot = document.getElementById('timeSlot').value;
    const classroom = currentClassroom;

    if (!classroom || !teacher || !timeSlot) {
        showAlert('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
        return;
    }

    const classStudents = students.filter(s => s.classroom === classroom);
    
    if (!attendanceData[date]) {
        attendanceData[date] = [];
    }

    const timeSlotText = {
        'morning': 'ภาคเช้า',
        'afternoon': 'ภาคบ่าย'
    };

    classStudents.forEach(student => {
        attendanceData[date].push({
            time: time,
            studentId: student.id,
            studentName: student.name,
            classroom: classroom,
            status: student.status || 'present',
            teacher: teacher,
            timeSlot: timeSlotText[timeSlot]
        });
    });

    saveData();
    showAlert('บันทึกการเช็กชื่อสำเร็จ', 'success');
}

// Load report
function loadReport() {
    const date = document.getElementById('reportDate').value;
    const tbody = document.getElementById('reportBody');
    const table = document.getElementById('reportTable');
    const loading = document.getElementById('loading');

    tbody.innerHTML = '';
    
    if (!date || !attendanceData[date]) {
        table.style.display = 'none';
        return;
    }

    loading.classList.add('active');
    
    setTimeout(() => {
        const records = attendanceData[date];
        
        records.forEach(record => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${record.time}</td>
                <td>${record.studentId}</td>
                <td>${record.studentName}</td>
                <td><span class="status-badge ${record.status}">${getStatusText(record.status)}</span></td>
                <td>${record.teacher}</td>
                <td>${record.timeSlot}</td>
            `;
        });

        loading.classList.remove('active');
        table.style.display = 'table';
    }, 500);
}

// Get status text in Thai
function getStatusText(status) {
    const statusMap = {
        'present': 'มาเรียน',
        'absent': 'ขาดเรียน',
        'sick': 'ลาป่วย',
        'activity': 'ไปกิจกรรม',
        'home': 'ลากลับบ้าน'
    };
    return statusMap[status] || status;
}

// Clear all students
function clearAllStudents() {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลนักเรียนทั้งหมด?')) {
        students = [];
        attendanceData = {};
        saveData();
        loadStudents();
        showAlert('ลบข้อมูลนักเรียนทั้งหมดแล้ว', 'success');
    }
}

// Show alert
function showAlert(message, type) {
    const alert = document.getElementById(type + 'Alert');
    alert.textContent = message;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}

// Show import help modal
function showImportHelp() {
    document.getElementById('importHelpModal').style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Import from Google Sheets
async function importFromSheets() {
    const spreadsheetId = document.getElementById('spreadsheetId').value.trim();
    const range = document.getElementById('sheetRange').value.trim();
    const classroom = document.getElementById('classSelect').value;

    if (!spreadsheetId || !range || !classroom) {
        showAlert('กรุณากรอก Spreadsheet ID, Range และเลือกตอนเรียน', 'error');
        return;
    }

    // Show loading
    showAlert('กำลังเชื่อมต่อกับ Google Sheets...', 'success');

    try {
        // ในการใช้งานจริง คุณต้องใส่ API Key ของคุณเอง
        const API_KEY = 'YOUR_API_KEY_HERE'; // *** ต้องใส่ API Key จริง ***
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${API_KEY}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('ไม่สามารถเชื่อมต่อกับ Google Sheets ได้');
        }

        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            showAlert('ไม่พบข้อมูลในช่วงที่ระบุ', 'error');
            return;
        }

        // Process and preview data
        tempImportData = data.values.map(row => ({
            id: row[0] || '',
            name: row[1] || '',
            classroom: row[2] || classroom,
            status: 'present'
        })).filter(student => student.id && student.name);

        showImportPreview(tempImportData);

    } catch (error) {
        console.error('Error importing from Google Sheets:', error);
        
        // ถ้าเกิดข้อผิดพลาด แสดงข้อมูลตัวอย่าง
        showAlert('ไม่สามารถเชื่อมต่อ Google Sheets ได้ในสภาพแวดล้อมนี้', 'error');
        
        // แสดงข้อมูลตัวอย่างเพื่อให้เห็นการทำงาน
        if (spreadsheetId === 'demo') {
            const demoData = [
                { id: '12345', name: 'สมชาย ใจดี', classroom: classroom, status: 'present' },
                { id: '12346', name: 'สมหญิง รักเรียน', classroom: classroom, status: 'present' },
                { id: '12347', name: 'สมศักดิ์ ขยันเรียน', classroom: classroom, status: 'present' },
                { id: '12348', name: 'สมศรี ตั้งใจดี', classroom: classroom, status: 'present' },
                { id: '12349', name: 'สมพร เรียนเก่ง', classroom: classroom, status: 'present' },
                { id: '12350', name: 'สมใจ อ่านหนังสือ', classroom: classroom, status: 'present' },
                { id: '12351', name: 'สมคิด วิเคราะห์ดี', classroom: classroom, status: 'present' },
                { id: '12352', name: 'สมทรง ความรู้', classroom: classroom, status: 'present' },
                { id: '12353', name: 'สมบัติ ขยันทำงาน', classroom: classroom, status: 'present' },
                { id: '12354', name: 'สมหวัง พัฒนาตน', classroom: classroom, status: 'present' }
            ];
            tempImportData = demoData;
            showImportPreview(demoData);
            showAlert('แสดงข้อมูลตัวอย่าง (พิมพ์ "demo" ใน Spreadsheet ID)', 'success');
        }
    }
}

// Show import preview
function showImportPreview(data) {
    const modal = document.getElementById('importPreviewModal');
    const content = document.getElementById('importPreviewContent');
    
    let html = `
        <p>พบข้อมูลนักเรียน ${data.length} คน</p>
        <table class="preview-table">
            <thead>
                <tr>
                    <th>รหัสนักเรียน</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th>ตอนเรียน</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(student => {
        html += `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.classroom}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    content.innerHTML = html;
    modal.style.display = 'block';
}

// Confirm import
function confirmImport() {
    const classroom = document.getElementById('classSelect').value;
    let imported = 0;
    let skipped = 0;

    tempImportData.forEach(newStudent => {
        // Check if student already exists
        const exists = students.find(s => 
            s.id === newStudent.id && s.classroom === classroom
        );

        if (!exists) {
            students.push({
                ...newStudent,
                classroom: classroom
            });
            imported++;
        } else {
            skipped++;
        }
    });

    saveData();
    loadStudents();
    closeModal('importPreviewModal');
    
    let message = `นำเข้าสำเร็จ ${imported} คน`;
    if (skipped > 0) {
        message += ` (ข้ามที่ซ้ำ ${skipped} คน)`;
    }
    showAlert(message, 'success');
    
    tempImportData = [];
}

// Export to Google Sheets (updated function)
function exportToSheets() {
    const date = document.getElementById('reportDate').value || new Date().toISOString().split('T')[0];
    
    if (!attendanceData[date]) {
        showAlert('ไม่มีข้อมูลการเช็กชื่อในวันที่เลือก กรุณาเลือกวันที่ในแท็บรายงาน', 'error');
        return;
    }
    
    // แสดงวิธีการ export
    showExportInstructions(date);
}

// แสดงคำแนะนำการ export
function showExportInstructions(date) {
    const records = attendanceData[date];
    
    // สร้างข้อมูลในรูปแบบที่ copy ได้
    const headers = ['วันที่', 'เวลา', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ตอนเรียน', 'สถานะ', 'ครูผู้เช็ก', 'ช่วงเวลา'];
    const rows = records.map(record => [
        date,
        record.time,
        record.studentId,
        record.studentName,
        record.classroom,
        getStatusText(record.status),
        record.teacher,
        record.timeSlot
    ]);
    
    // สร้างข้อมูลแบบ TSV (Tab-separated values)
    const tsvContent = [headers, ...rows].map(row => row.join('\t')).join('\n');
    
    // สร้าง modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2>📊 ส่งออกข้อมูลไป Google Sheets</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            
            <div class="help-section">
                <h3>📋 วิธีที่ 1: คัดลอกและวาง (แนะนำ)</h3>
                <ol style="margin-left: 20px; color: #555; line-height: 1.8;">
                    <li>คลิกปุ่ม "คัดลอกข้อมูล" ด้านล่าง</li>
                    <li>เปิด Google Sheets ที่ต้องการบันทึกข้อมูล</li>
                    <li>คลิกที่เซลล์ที่ต้องการเริ่มวางข้อมูล (เช่น A1)</li>
                    <li>กด <strong>Ctrl+V</strong> (Windows) หรือ <strong>Cmd+V</strong> (Mac)</li>
                </ol>
                
                <div style="margin: 20px 0; text-align: center;">
                    <button onclick="copyToClipboard('${btoa(unescape(encodeURIComponent(tsvContent)))}')" 
                            style="background: #34a853; padding: 12px 30px; font-size: 16px;">
                        📋 คัดลอกข้อมูล
                    </button>
                    <button onclick="downloadCSV('${date}')" 
                            style="background: #4285f4; padding: 12px 30px; font-size: 16px;">
                        💾 ดาวน์โหลด CSV
                    </button>
                </div>
                
                <h3>📊 วิธีที่ 2: นำเข้าจากไฟล์ CSV</h3>
                <ol style="margin-left: 20px; color: #555; line-height: 1.8;">
                    <li>คลิก "ดาวน์โหลด CSV" เพื่อบันทึกไฟล์</li>
                    <li>เปิด Google Sheets</li>
                    <li>ไปที่ <strong>ไฟล์ > นำเข้า</strong></li>
                    <li>เลือก <strong>อัปโหลด</strong> แล้วเลือกไฟล์ CSV</li>
                    <li>เลือก <strong>แทนที่ข้อมูลปัจจุบัน</strong> หรือ <strong>ผนวกกับแผ่นงานปัจจุบัน</strong></li>
                </ol>
                
                <h3>💡 ตัวอย่างข้อมูล (${records.length} รายการ)</h3>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; max-height: 300px;">
                    <table class="preview-table" style="width: 100%; font-size: 12px;">
                        <thead>
                            <tr>
                                ${headers.map(h => `<th style="position: sticky; top: 0; background: #e0e0e0;">${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.slice(0, 10).map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                            ${records.length > 10 ? '<tr><td colspan="8" style="text-align: center;">... และอื่นๆ อีก ' + (records.length - 10) + ' รายการ</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
                
                <div class="help-section" style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h4 style="color: #2e7d32; margin-bottom: 10px;">✅ เคล็ดลับ</h4>
                    <ul style="margin-left: 20px; color: #555;">
                        <li>ข้อมูลจะถูกจัดรูปแบบให้พร้อมใช้งานใน Google Sheets</li>
                        <li>สามารถวางข้อมูลต่อท้ายข้อมูลเดิมได้</li>
                        <li>Google Sheets จะจัดคอลัมน์ให้อัตโนมัติ</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// คัดลอกข้อมูล
function copyToClipboard(encodedData) {
    try {
        const data = decodeURIComponent(escape(atob(encodedData)));
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(data).then(() => {
                showAlert('คัดลอกข้อมูลสำเร็จ! 📋 พร้อมวางใน Google Sheets แล้ว', 'success');
            }).catch(() => {
                fallbackCopyToClipboard(data);
            });
        } else {
            fallbackCopyToClipboard(data);
        }
    } catch (error) {
        console.error('Error copying:', error);
        showAlert('เกิดข้อผิดพลาดในการคัดลอก กรุณาลองใหม่', 'error');
    }
}

// Fallback copy function
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showAlert('คัดลอกข้อมูลสำเร็จ! 📋', 'success');
        } else {
            showAlert('ไม่สามารถคัดลอกได้ กรุณาเลือกข้อมูลแล้วกด Ctrl+C', 'error');
        }
    } catch (err) {
        console.error('Fallback copy error:', err);
        showAlert('ไม่สามารถคัดลอกได้ กรุณาเลือกข้อมูลแล้วกด Ctrl+C', 'error');
    }
    
    document.body.removeChild(textArea);
}

// ดาวน์โหลด CSV
function downloadCSV(date) {
    const records = attendanceData[date];
    if (!records || records.length === 0) {
        showAlert('ไม่มีข้อมูลสำหรับดาวน์โหลด', 'error');
        return;
    }
    
    // สร้าง CSV content พร้อม BOM สำหรับ Excel ภาษาไทย
    const BOM = '\uFEFF';
    const headers = ['วันที่', 'เวลา', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ตอนเรียน', 'สถานะ', 'ครูผู้เช็ก', 'ช่วงเวลา'];
    const rows = records.map(record => [
        date,
        record.time,
        record.studentId,
        record.studentName,
        record.classroom,
        getStatusText(record.status),
        record.teacher,
        record.timeSlot
    ]);
    
    // สร้าง CSV string
    const csvContent = BOM + [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    // สร้าง Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // สร้าง download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert(`ดาวน์โหลดไฟล์ attendance_${date}.csv สำเร็จ! 💾`, 'success');
}

// Open Google Sheets
function openGoogleSheets() {
    const sheetUrl = document.getElementById('outputSheetUrl').value.trim();
    
    if (!sheetUrl) {
        showAlert('กรุณาใส่ URL ของ Google Sheets', 'error');
        return;
    }
    
    // ตรวจสอบว่าเป็น URL ของ Google Sheets
    if (!sheetUrl.includes('docs.google.com/spreadsheets')) {
        showAlert('กรุณาใส่ URL ที่ถูกต้องของ Google Sheets', 'error');
        return;
    }
    
    // เปิด Google Sheets ในแท็บใหม่
    window.open(sheetUrl, '_blank');
}

// Export data to Google Sheets
async function exportDataToSheets() {
    const sheetUrl = document.getElementById('outputSheetUrl').value.trim();
    const date = document.getElementById('reportDate').value;
    
    if (!sheetUrl) {
        showAlert('กรุณาใส่ URL ของ Google Sheets', 'error');
        return;
    }
    
    if (!date || !attendanceData[date]) {
        showAlert('ไม่มีข้อมูลการเช็กชื่อในวันที่เลือก', 'error');
        return;
    }
    
    // แยก Spreadsheet ID จาก URL
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
        showAlert('ไม่สามารถอ่าน Spreadsheet ID จาก URL ได้', 'error');
        return;
    }
    
    const spreadsheetId = match[1];
    const API_KEY = 'YOUR_API_KEY_HERE'; // *** ต้องใส่ API Key จริง ***
    
    // เตรียมข้อมูลสำหรับส่งออก
    const records = attendanceData[date];
    const headers = [['วันที่', 'เวลา', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ตอนเรียน', 'สถานะ', 'ครูผู้เช็ก', 'ช่วงเวลา']];
    
    const values = records.map(record => [
        date,
        record.time,
        record.studentId,
        record.studentName,
        record.classroom,
        getStatusText(record.status),
        record.teacher,
        record.timeSlot
    ]);
    
    // รวม headers กับข้อมูล
    const allData = [...headers, ...values];
    
    showAlert('กำลังส่งข้อมูลไปยัง Google Sheets...', 'success');
    
    try {
        // ใช้ Google Sheets API เพื่อเพิ่มข้อมูล
        const range = `Sheet1!A:H`; // เขียนข้อมูลตั้งแต่คอลัมน์ A ถึง H
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: allData
            })
        });
        
        if (!response.ok) {
            throw new Error('ไม่สามารถส่งข้อมูลได้');
        }
        
        showAlert('ส่งข้อมูลไปยัง Google Sheets สำเร็จ!', 'success');
        
        // ถามว่าต้องการเปิด Google Sheets หรือไม่
        if (confirm('ส่งข้อมูลสำเร็จ! ต้องการเปิด Google Sheets เพื่อดูข้อมูลหรือไม่?')) {
            window.open(sheetUrl, '_blank');
        }
        
    } catch (error) {
        console.error('Error exporting to Google Sheets:', error);
        
        // แสดงวิธีการ manual export
        showManualExportInstructions(allData);
    }
}

// แสดงวิธีการ export แบบ manual
function showManualExportInstructions(data) {
    // สร้างข้อมูลในรูปแบบที่ copy ได้
    const csvContent = data.map(row => row.join('\t')).join('\n');
    
    // สร้าง modal แสดงข้อมูล
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>📋 คัดลอกข้อมูลไปวางใน Google Sheets</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            
            <div class="help-section">
                <p>ไม่สามารถส่งข้อมูลอัตโนมัติได้ในสภาพแวดล้อมนี้ กรุณาคัดลอกข้อมูลด้านล่างแล้วนำไปวางใน Google Sheets:</p>
                
                <h3>📝 ขั้นตอน:</h3>
                <ol style="margin-left: 20px; color: #555;">
                    <li>คลิกปุ่ม "คัดลอกข้อมูล" ด้านล่าง</li>
                    <li>เปิด Google Sheets</li>
                    <li>คลิกที่เซลล์ A1</li>
                    <li>กด Ctrl+V (Windows) หรือ Cmd+V (Mac) เพื่อวาง</li>
                </ol>
                
                <div style="margin: 20px 0;">
                    <button onclick="copyDataToClipboard('${btoa(csvContent)}')" style="background: #34a853;">
                        📋 คัดลอกข้อมูล
                    </button>
                    <button onclick="openGoogleSheets()" style="background: #4285f4;">
                        📊 เปิด Google Sheets
                    </button>
                </div>
                
                <h3>💡 ข้อมูลที่จะคัดลอก:</h3>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; max-height: 300px;">
                    <pre style="margin: 0; font-size: 12px;">${csvContent}</pre>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// คัดลอกข้อมูลไปยัง clipboard
function copyDataToClipboard(encodedData) {
    const data = atob(encodedData);
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(data).then(() => {
            showAlert('คัดลอกข้อมูลสำเร็จ! นำไปวางใน Google Sheets ได้เลย', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(data);
        });
    } else {
        fallbackCopyToClipboard(data);
    }
}

// บันทึก URL ของ Google Sheets
function saveOutputSheetUrl() {
    const url = document.getElementById('outputSheetUrl').value;
    if (url) {
        localStorage.setItem('outputSheetUrl', url);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}