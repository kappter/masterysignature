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

    // Function to draw the preview as a circular arc
    function drawPreview() {
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        previewCtx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        const totalPoints = answers.times.reduce((sum, val) => sum + val, 0) || 1;
        let startAngle = -Math.PI / 2; // Start at top

        // Draw circular arcs
        for (let i = 0; i < answers.times.length; i++) {
            if (answers.times[i] === 0) continue;
            const arcLength = (answers.times[i] / totalPoints) * 2 * Math.PI;
            previewCtx.beginPath();
            previewCtx.arc(centerX, centerY, radius, startAngle, startAngle + arcLength);
            previewCtx.lineWidth = 10 * (answers.difficulties[i] / 5);
            previewCtx.strokeStyle = chakraColors[i];
            previewCtx.lineCap = 'butt';
            previewCtx.stroke();
            startAngle += arcLength;
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
        const nonZeroTimes = times.filter(val => val > 0);
        const averageLevel = nonZeroTimes.length > 0 ? Math.round(nonZeroTimes.reduce((sum, val) => sum + val, 0) / nonZeroTimes.length) : 0;

        // Determine tier
        const hasHigherLevels = times.slice(3).some(time => time > 0);
        const tier = (!hasHigherLevels) ? 'Tier One Candidate' : 'Advanced Learner';

        // Display results
        formSection.style.display = 'none';
        resultSection.style.display = 'block';
        document.getElementById('result-topic').textContent = topic;
        document.getElementById('result-level').textContent = averageLevel;
        document.getElementById('result-tier').textContent = tier;

        // Calculate segment angles
        const totalPoints = times.reduce((sum, val) => sum + val, 0) || 1;
        const segmentAngles = times.map(val => (val / totalPoints) * 2 * Math.PI);

        // Draw the final mastery symbol
        drawMasterySymbol(averageLevel, segmentAngles, difficulties, hasHigherLevels, times);

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

        // Next steps
        const nextSteps = hasHigherLevels
            ? `As an Advanced Learner, focus on deepening your contributions (Level 6) and exploring innovation (Level 7). Consider mentoring others or starting a project to push the boundaries of ${topic}.`
            : `As a Tier One Candidate, continue building your foundation. Increase time spent on Levels 1-3 and seek more challenging tasks to progress toward Level 4 (Reflection) and beyond.`;
        document.getElementById('next-steps').textContent = nextSteps;
    });

    // Function to draw the final mastery symbol as a circular arc with labels
    function drawMasterySymbol(level, segmentAngles, difficulties, hasHigherLevels, times) {
        const width = masteryCanvas.width;
        const height = masteryCanvas.height;
        masteryCtx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        let startAngle = -Math.PI / 2; // Start at top

        // Draw circular arcs
        for (let i = 0; i < times.length; i++) {
            if (times[i] === 0) continue;
            const arcLength = segmentAngles[i];
            masteryCtx.beginPath();
            masteryCtx.arc(centerX, centerY, radius, startAngle, startAngle + arcLength);
            masteryCtx.lineWidth = 15 * (difficulties[i] / 5);
            masteryCtx.strokeStyle = chakraColors[i];
            masteryCtx.lineCap = 'butt';
            masteryCtx.stroke();

            // Add label
            const labelAngle = startAngle + arcLength / 2;
            const labelX = centerX + (radius + 20) * Math.cos(labelAngle);
            const labelY = centerY + (radius + 20) * Math.sin(labelAngle);
            masteryCtx.font = '12px Arial';
            masteryCtx.fillStyle = chakraColors[i];
            masteryCtx.textAlign = 'center';
            masteryCtx.textBaseline = 'middle';
            masteryCtx.fillText(`Level ${i + 1}`, labelX, labelY);

            startAngle += arcLength;
        }

        // Add central text
        masteryCtx.font = '20px Arial';
        masteryCtx.fillStyle = '#333';
        masteryCtx.textAlign = 'center';
        masteryCtx.textBaseline = 'middle';
        masteryCtx.fillText(`Mastery Level: ${level}`, centerX, centerY);
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
        masteryCtx.clearRect(0, 0, masteryCanvas.width, masteryCanvas.height);
        showQuestion(currentQuestion);
    });

    // Initialize first question
    showQuestion(currentQuestion);
});