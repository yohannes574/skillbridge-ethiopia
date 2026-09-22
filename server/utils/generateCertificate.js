/**
 * Generates a premium printable/downloadable HTML certificate string.
 * Integrates html2pdf.js so the student can directly download it.
 */
const generateCertificateHTML = ({ studentName, courseName, mentorName, issuedAt }) => {
  const date = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate - ${studentName}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600&family=Pinyon+Script&display=swap');
    
    * { box-sizing: border-box; }
    body { 
      margin: 0; padding: 40px; background: #0f172a; 
      font-family: 'Montserrat', sans-serif; 
      display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;
    }

    .btn-download {
      margin-bottom: 30px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      background: linear-gradient(135deg, #059669, #10b981);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-download:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6); }

    /* The actual certificate container */
    .cert-wrapper {
      width: 1000px;
      height: 707px; /* A4 aspect ratio (Landscape) */
      background: #fff;
      position: relative;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }

    .cert-inner {
      width: 100%;
      height: 100%;
      border: 2px solid #deb887;
      padding: 10px;
      position: relative;
    }

    .cert-core {
      width: 100%;
      height: 100%;
      border: 1px solid #deb887;
      background-color: #fdfbf7;
      background-image: radial-gradient(#d1cfcb 1px, transparent 1px);
      background-size: 20px 20px;
      padding: 50px;
      text-align: center;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 15rem; color: rgba(16, 185, 129, 0.04);
      font-family: 'Cinzel', serif; font-weight: 800;
      pointer-events: none; z-index: 1;
    }

    .cert-content { position: relative; z-index: 10; }

    .logo-container {
      display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 20px;
    }
    .logo-icon {
      width: 50px; height: 50px; background: linear-gradient(135deg, #059669, #022c22);
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 24px; font-weight: 800; border: 2px solid #deb887;
    }
    .logo-text { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 700; color: #022c22; letter-spacing: 2px; }

    .subtitle { color: #d4af37; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; font-weight: 600; margin-bottom: 20px; }
    h1 { font-family: 'Cinzel', serif; font-size: 56px; color: #064e3b; margin: 0 0 10px; font-weight: 800; letter-spacing: 4px; }
    
    .presents { color: #475569; font-size: 16px; margin: 30px 0 20px; font-style: italic; }
    
    .student-name { font-family: 'Pinyon Script', cursive; font-size: 72px; color: #0f172a; margin: 10px 0 20px; line-height: 1; }
    
    .desc { color: #334155; font-size: 18px; line-height: 1.8; margin-bottom: 40px; max-width: 700px; margin-left: auto; margin-right: auto; }
    .course-name { font-weight: 700; color: #064e3b; font-size: 24px; border-bottom: 1px dashed #deb887; padding-bottom: 2px; }

    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding: 0 40px; }
    .sig { text-align: center; width: 220px; }
    
    .sig-img { height: 60px; font-family: 'Pinyon Script', cursive; font-size: 38px; color: #0f172a; line-height: 60px; border-bottom: 1px solid #94a3b8; margin-bottom: 8px; }
    .date-text { height: 60px; font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 500; color: #0f172a; line-height: 80px; border-bottom: 1px solid #94a3b8; margin-bottom: 8px; }

    .sig-name { font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;}
    .sig-title { color: #64748b; font-size: 12px; }
    
    .seal {
      width: 120px; height: 120px; background: radial-gradient(circle, #fcd34d 0%, #b45309 100%);
      border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; justify-content: center;
      border: 4px dashed #fff;
    }
    .seal-inner {
      width: 90px; height: 90px; border: 1px solid #fff; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Cinzel', serif; color: #fff; font-size: 10px; font-weight: 700; text-align: center; line-height: 1.4;
    }

  </style>
</head>
<body>

  <button class="btn-download" onclick="downloadPDF()" id="downloadBtn">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    Download as PDF
  </button>

  <div class="cert-wrapper" id="certificate-node">
    <div class="cert-inner">
      <div class="cert-core">
        <div class="watermark">SBE</div>
        
        <div class="cert-content">
          <div class="logo-container">
            <div class="logo-icon">SB</div>
            <div class="logo-text">Skill Bridge Ethiopia</div>
          </div>
          
          <div class="subtitle">Official Certification</div>
          <h1>Certificate of Completion</h1>
          
          <div class="presents">This is proudly presented to</div>
          
          <div class="student-name">${studentName}</div>
          
          <div class="desc">
            For successfully fulfilling all the requirements, demonstrating exceptional skills, and passing the final assessments in the course<br/><br/>
            <span class="course-name">${courseName}</span>
          </div>

          <div class="seal">
            <div class="seal-inner">CERTIFIED<br/>ACHIEVEMENT<br/>🏆</div>
          </div>
          
          <div class="footer">
            <div class="sig">
              <div class="sig-img">${mentorName}</div>
              <div class="sig-name">${mentorName}</div>
              <div class="sig-title">Course Mentor</div>
            </div>
            <div class="sig">
              <div class="date-text">${date}</div>
              <div class="sig-name">Date of Issue</div>
              <div class="sig-title">Valid & Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function downloadPDF() {
      const element = document.getElementById('certificate-node');
      const btn = document.getElementById('downloadBtn');
      
      btn.innerHTML = 'Generating PDF... Please wait';
      btn.style.opacity = '0.7';
      btn.disabled = true;

      const opt = {
        margin:       0,
        filename:     '${studentName.replace(/\s+/g, '_')}_Certificate.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download as PDF';
        btn.style.opacity = '1';
        btn.disabled = false;
      });
    }
  </script>
</body>
</html>`;
};

module.exports = { generateCertificateHTML };
