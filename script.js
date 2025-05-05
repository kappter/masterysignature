document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mastery-form');
    const questions = document.querySelectorAll('.question');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formSection = document.getElementById('form-section');
    const resultSection = document.getElementById('result-section');
    const previewCanvas = document.getElementById('preview-canvas');
    const masteryCanvas = document.getElementById('mastery-canvas');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const previewCtx = previewCanvas.getContext('2d');
    const masteryCtx = masteryCanvas.getContext('2d');
    let currentQuestion = 0;
    let answers = { times: [], difficulties: [] };

    // Chakra colors for each level
    const chakraColors = [
        '#FF0000', // Red (Level 1)
        '#FF4500', // Orange (Level 2)
        '#FFFF00', // Yellow (Level 3)
        '#00FF00', // Green (Level 4)
        '#0000FF', // Blue (Level 5)
        '#4B0082', // Indigo (Level 6)
        '#EE82EE'  // Violet (Level 7)
    ];

    // Pagination logic
    const showQuestion = (index) => {
        questions.forEach((q, i) => {
            q.classList.toggle('active', i === index);
        });
        prevBtn.disabled = index === 0;
        nextBtn.style.display = index === questions.length - 1 ? 'none' : 'inline-block';
        submitBtn.style.display = index === questions.length - 1 ? 'inline-block' : 'none';
    };

    prevBtn.addEventListener('click', () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            showQuestion(currentQuestion);
        }
    });

    nextBtn.addEventListener('click', () => {
        const currentInputs = questions[currentQuestion].querySelectorAll('select, input');
        if (Array.from(currentInputs).every(input => input.value)) {
            if (currentQuestion < questions.length - 1) {
                // Store the current answers
                if (currentQuestion > 0) {
                    const time = parseInt(questions[currentQuestion].querySelector(`select[name="time${currentQuestion}"]`).value);
                    const diff = parseInt(questions[currentQuestion].querySelector(`select[name="diff${currentQuestion}"]`).value);
                    answers.times[currentQuestion - 1] = time;
                    answers.difficulties[currentQuestion - 1] = diff;
                }
                currentQuestion++;
                showQuestion(currentQuestion);
                // Update preview
                drawPreview();
            }
        } else {
            alert('Please answer all questions before proceeding.');
        }
    });

    // Function to draw the preview as a horizontal line
    function drawPreview() {
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        previewCtx.clearRect(0, 0, width, height);

        const totalLineLength = 960; // Total length of the line in pixels
        const startX = (width - totalLineLength) / 2; // Center the line horizontally
        const y = height / 2; // Center vertically

        // Calculate segment lengths
        const totalPoints = answers.times.reduce((sum, val) => sum + val, 0) || 1;
        const segmentLengths = answers.times.map(val => (val / totalPoints) * totalLineLength);

        // Draw horizontal line segments
        let currentX = startX;
        for (let i = 0; i < answers.times.length; i++) {
            if (answers.times[i] === 0) continue;
            const segmentLength = segmentLengths[i];
            previewCtx.beginPath();
            previewCtx.moveTo(currentX, y);
            previewCtx.lineTo(currentX + segmentLength, y);
            previewCtx.lineWidth = 10 * (answers.difficulties[i] / 5); // Thickness based on difficulty
            previewCtx.strokeStyle = chakraColors[i];
            previewCtx.lineCap = 'butt'; // Flat ends for clean segment joins
            previewCtx.stroke();
            currentX += segmentLength;
        }
    }

    // Form submission and result calculation
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const topic = formData.get('mastery-topic');
        const times = [
            parseInt(formData.get('time1')),
            parseInt(formData.get('time2')),
            parseInt(formData.get('time3')),
            parseInt(formData.get('time4')),
            parseInt(formData.get('time5')),
            parseInt(formData.get('time6')),
            parseInt(formData.get('time7'))
        ];
        const difficulties = [
            parseInt(formData.get('diff1')),
            parseInt(formData.get('diff2')),
            parseInt(formData.get('diff3')),
            parseInt(formData.get('diff4')),
            parseInt(formData.get('diff5')),
            parseInt(formData.get('diff6')),
            parseInt(formData.get('diff7'))
        ];

        // Calculate average mastery level
        const total = times.reduce((sum, val) => sum + val, 0);
        const averageLevel = times.some(val => val > 0) ? Math.round(total / times.filter(val => val > 0).length) : 0;

        // Determine if user is a Tier One Candidate
        const hasHigherLevels = times.slice(3).some(time => time > 0);
        const tier = (!hasHigherLevels) ? 'Tier One Candidate' : 'Advanced Learner';

        // Display results
        formSection.style.display = 'none';
        resultSection.style.display = 'block';
        document.getElementById('result-topic').textContent = topic;
        document.getElementById('result-level').textContent = averageLevel;
        document.getElementById('result-tier').textContent = tier;

        // Calculate segment lengths
        const totalPoints = times.reduce((sum, val) => sum + val, 0) || 1;
        const segmentLengths = times.map(val => (val / totalPoints) * 960);

        // Draw the final mastery symbol
        drawMasterySymbol(averageLevel, segmentLengths, difficulties, hasHigherLevels, times);

        // Future projections
        const projectLevel = (years) => {
            const growthRate = 0.1;
            return Math.min(7, Math.round(averageLevel + growthRate * years));
        };

        document.getElementById('proj-1-year').textContent = projectLevel(1);
        document.getElementById('proj-5-years').textContent = projectLevel(5);
        document.getElementById('proj-10-years').textContent = projectLevel(10);
        document.getElementById('proj-25-years').textContent = projectLevel(25);
        document.getElementById('proj-50-years').textContent = projectLevel(50);
    });

    // Function to draw the final mastery symbol as a horizontal line
    function drawMasterySymbol(level, segmentLengths, difficulties, hasHigherLevels, times) {
        const width = masteryCanvas.width;
        const height = masteryCanvas.height;
        masteryCtx.clearRect(0, 0, width, height);

        const totalLineLength = 960; // Total length of the line in pixels
        const startX = (width - totalLineLength) / 2; // Center the line horizontally
        const y = height / 2; // Center vertically

        // Draw horizontal line segments
        let currentX = startX;
        for (let i = 0; i < times.length; i++) {
            if (times[i] === 0) continue;
            const segmentLength = segmentLengths[i];
            masteryCtx.beginPath();
            masteryCtx.moveTo(currentX, y);
            masteryCtx.lineTo(currentX + segmentLength, y);
            masteryCtx.lineWidth = 10 * (difficulties[i] / 5); // Thickness based on difficulty
            masteryCtx.strokeStyle = chakraColors[i];
            masteryCtx.lineCap = 'butt'; // Flat ends for clean segment joins
            masteryCtx.stroke();
            currentX += segmentLength;
        }
    }

    // Download canvas as image
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'mastery-signature.png';
        link.href = masteryCanvas.toDataURL('image/png');
        link.click();
    });

    // Copy canvas to clipboard
    copyBtn.addEventListener('click', () => {
        masteryCanvas.toBlob((blob) => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
                alert('Mastery Signature copied to clipboard!');
            }).catch((err) => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy to clipboard.');
            });
        });
    });

    // Initialize first question
    showQuestion(currentQuestion);
});