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
    const restartBtn = document.getElementById('restart-btn');
    const previewCtx = previewCanvas.getContext('2d');
    const masteryCtx = masteryCanvas.getContext('2d');
    let currentQuestion = 0;
    let answers = { times: [], difficulties: [] };

    // Earth tone colors for each level
    const earthTones = [
        '#F5F5DC', // Sandy Beige (Level 1)
        '#E2725B', // Terracotta (Level 2)
        '#808000', // Olive Green (Level 3)
        '#8B4513', // Earth Brown (Level 4)
        '#228B22', // Forest Green (Level 5)
        '#708090', // Stone Gray (Level 6)
        '#5C4033'  // Deep Clay (Level 7)
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
                if (currentQuestion > 0) {
                    const time = parseInt(questions[currentQuestion].querySelector(`select[name="time${currentQuestion}"]`).value);
                    const diff = parseInt(questions[currentQuestion].querySelector(`select[name="diff${currentQuestion}"]`).value);
                    answers.times[currentQuestion - 1] = time;
                    answers.difficulties[currentQuestion - 1] = diff;
                }
                currentQuestion++;
                showQuestion(currentQuestion);
                drawPreview();
            }
        } else {
            alert('Please answer all questions before proceeding.');
        }
    });

    // Function to draw the preview as a simplified mountain range
    function drawPreview() {
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        previewCtx.clearRect(0, 0, width, height);

        // Background sky
        previewCtx.fillStyle = '#E6E6FA'; // Light lavender sky
        previewCtx.fillRect(0, 0, width, height);

        const peakWidth = width / 7; // Divide canvas into 7 sections for preview
        const baseY = height - 20;

        for (let i = 0; i < answers.times.length; i++) {
            if (answers.times[i] === 0) continue;
            const time = answers.times[i];
            const difficulty = answers.difficulties[i];
            const peakHeight = (time / 500) * (height - 40); // Scale height by time (max 500)
            const peakBaseWidth = difficulty * 10; // Scale width by difficulty

            const x = i * peakWidth + peakWidth / 2;
            previewCtx.beginPath();
            previewCtx.moveTo(x - peakBaseWidth, baseY);
            previewCtx.lineTo(x, baseY - peakHeight);
            previewCtx.lineTo(x + peakBaseWidth, baseY);
            previewCtx.closePath();
            previewCtx.fillStyle = earthTones[i];
            previewCtx.fill();
            previewCtx.strokeStyle = '#333';
            previewCtx.lineWidth = 1;
            previewCtx.stroke();
        }
    }

    // Function to map average time to a 1-7 scale
    function mapToMasteryLevel(averageTime) {
        if (averageTime === 0) return 0;
        if (averageTime <= 10) return 1;
        if (averageTime <= 50) return 2;
        if (averageTime <= 100) return 3;
        if (averageTime <= 200) return 4;
        if (averageTime <= 300) return 5;
        if (averageTime <= 400) return 6;
        return 7;
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

        // Calculate mastery progress score
        const nonZeroTimes = times.filter(val => val > 0);
        const averageTime = nonZeroTimes.length > 0 ? nonZeroTimes.reduce((sum, val) => sum + val, 0) / nonZeroTimes.length : 0;
        const masteryProgressScore = mapToMasteryLevel(Math.round(averageTime));

        // Determine tier
        const hasHigherLevels = times.slice(3).some(time => time > 0);
        const tier = (!hasHigherLevels) ? 'Tier One Candidate' : 'Advanced Learner';

        // Display results
        formSection.style.display = 'none';
        resultSection.style.display = 'block';
        document.getElementById('result-topic').textContent = topic;
        document.getElementById('result-level').textContent = masteryProgressScore;
        document.getElementById('result-tier').textContent = tier;

        // Calculate segment proportions (not used directly for mountains)
        const totalPoints = times.reduce((sum, val) => sum + val, 0) || 1;
        const segmentProportions = times.map(val => (val / totalPoints) * 2 * Math.PI);

        // Draw the final mastery symbol
        drawMasterySymbol(masteryProgressScore, segmentProportions, difficulties, hasHigherLevels, times);

        // Future projections
        const projectLevel = (years) => {
            const growthRate = 0.1;
            const projectedTime = averageTime + (growthRate * years * 100);
            return Math.min(7, mapToMasteryLevel(Math.round(projectedTime)));
        };

        document.getElementById('proj-1-year').textContent = projectLevel(1);
        document.getElementById('proj-5-years').textContent = projectLevel(5);
        document.getElementById('proj-10-years').textContent = projectLevel(10);
        document.getElementById('proj-25-years').textContent = projectLevel(25);
        document.getElementById('proj-50-years').textContent = projectLevel(50);

        // Next steps
        const nextSteps = hasHigherLevels
            ? `As an Advanced Learner, focus on deepening your contributions (Level 6) and exploring innovation (Level 7). Consider mentoring others or starting a project to push the boundaries of ${topic}.`
            : `As a Tier One Candidate, continue building your foundation. Increase time spent on Levels 1-3 and seek more challenging tasks to progress toward Level 4 (Reflection) and beyond.`;
        document.getElementById('next-steps').textContent = nextSteps;
    });

    // Function to draw the final mastery symbol as a mountain range
    function drawMasterySymbol(level, segmentProportions, difficulties, hasHigherLevels, times) {
        const width = masteryCanvas.width;
        const height = masteryCanvas.height;
        masteryCtx.clearRect(0, 0, width, height);

        // Background sky
        masteryCtx.fillStyle = '#E6E6FA'; // Light lavender sky
        masteryCtx.fillRect(0, 0, width, height);

        // Ground baseline
        const baseY = height - 50;
        masteryCtx.fillStyle = '#D2B48C'; // Tan ground
        masteryCtx.fillRect(0, baseY, width, 50);

        const peakWidth = width / 7; // Divide canvas into 7 sections
        const maxHeight = height - 100; // Max height for peaks

        // Check for ample time past Level 4
        const ampleTimePastLevel4 = times.slice(4).reduce((sum, val) => sum + val, 0) > 100;

        // Draw each peak (mountain) for each level
        for (let i = 0; i < times.length; i++) {
            const time = times[i];
            if (time === 0) continue;
            const difficulty = difficulties[i];
            const peakHeight = (time / 500) * maxHeight; // Scale height by time
            const peakBaseWidth = difficulty * 15; // Scale width by difficulty

            const x = i * peakWidth + peakWidth / 2;
            masteryCtx.beginPath();
            masteryCtx.moveTo(x - peakBaseWidth, baseY);
            masteryCtx.lineTo(x, baseY - peakHeight);
            masteryCtx.lineTo(x + peakBaseWidth, baseY);
            masteryCtx.closePath();
            masteryCtx.fillStyle = earthTones[i];
            masteryCtx.fill();
            masteryCtx.strokeStyle = '#333';
            masteryCtx.lineWidth = 1;
            masteryCtx.stroke();

            // Add label below the peak
            masteryCtx.fillStyle = '#333';
            masteryCtx.font = '14px Arial';
            masteryCtx.textAlign = 'center';
            masteryCtx.textBaseline = 'middle';
            masteryCtx.fillText(`Level ${i + 1}`, x, baseY + 30);
        }

        // Draw infinity cloud if ample time past Level 4
        if (ampleTimePastLevel4) {
            masteryCtx.save();
            masteryCtx.translate(width / 2, 50); // Position cloud at top center
            masteryCtx.beginPath();
            const cloudSize = 50;
            const tSteps = 100;
            for (let t = 0; t <= tSteps; t++) {
                const tParam = (t / tSteps) * 2 * Math.PI;
                const r = cloudSize * Math.sqrt(2) * Math.cos(tParam) / (Math.sin(tParam) * Math.sin(tParam) + 1);
                const x = r * Math.cos(tParam);
                const y = r * Math.sin(tParam);
                if (t === 0) masteryCtx.moveTo(x, y);
                else masteryCtx.lineTo(x, y);
            }
            masteryCtx.closePath();
            masteryCtx.strokeStyle = '#D2B48C'; // Tan cloud
            masteryCtx.lineWidth = 5;
            masteryCtx.stroke();
            masteryCtx.restore();
        }

        // Add central text
        masteryCtx.fillStyle = '#333';
        masteryCtx.font = '24px Arial';
        masteryCtx.textAlign = 'center';
        masteryCtx.textBaseline = 'middle';
        masteryCtx.fillText(`Mastery Progress: ${level}`, width / 2, 30);
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

    // Restart the form
    restartBtn.addEventListener('click', () => {
        form.reset();
        answers = { times: [], difficulties: [] };
        currentQuestion = 0;
        formSection.style.display = 'block';
        resultSection.style.display = 'none';
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        masteryCtx.clearRect(0, 0, masteryCanvas.height, masteryCanvas.height);
        showQuestion(currentQuestion);
    });

    // Initialize first question
    showQuestion(currentQuestion);
});