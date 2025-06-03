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

    // Gradient color pairs for each level
    const gradientColors = [
        ['#F5F5DC', '#D2B48C'], // Level 1: Sandy Beige to Light Tan
        ['#E2725B', '#F4A460'], // Level 2: Terracotta to Soft Coral
        ['#808000', '#9ACD32'], // Level 3: Olive Green to Sage Green
        ['#8B4513', '#A0522D'], // Level 4: Earth Brown to Warm Brown
        ['#228B22', '#3CB371'], // Level 5: Forest Green to Moss Green
        ['#708090', '#4682B4'], // Level 6: Stone Gray to Slate Gray
        ['#5C4033', '#6F4E37']  // Level 7: Deep Clay to Rich Umber
    ];

    // Time value to label mapping
    const timeLabels = {
        0: 'None',
        1: 'Hours',
        5: 'Days',
        20: 'Weeks',
        50: 'Months',
        100: '1-2 Years',
        200: '2-5 Years',
        500: '5+ Years',
        10: '5-10 hours',
        40: '20-40 hours',
        60: '40-60 hours',
        80: '60+ hours'
    };

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

    // Function to draw the preview as a simplified Mastery Blossom
    function drawPreview() {
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        previewCtx.clearRect(0, 0, width, height);

        // Background sky
        previewCtx.fillStyle = '#E6E6FA'; // Light lavender sky
        previewCtx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2 - 40;
        const baseRadius = 20;

        // Determine the maximum time to scale the radius
        const maxTime = Math.max(...(answers.times.length > 0 ? answers.times : [0]), 0);
        const scaleFactor = maxTime > 0 ? (maxRadius - baseRadius) / maxTime : 1;

        // Draw the connected blossom shape
        previewCtx.beginPath();
        for (let i = 0; i < 7; i++) {
            const time = i < answers.times.length ? answers.times[i] : 0;
            const difficulty = i < answers.difficulties.length ? answers.difficulties[i] : 1;
            const radius = time > 0 ? baseRadius + (time * scaleFactor) : baseRadius;
            const angleStart = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const angleEnd = ((i + 1) / 7) * 2 * Math.PI - Math.PI / 2;
            const steps = 10;

            for (let t = 0; t <= steps; t++) {
                const angle = angleStart + (t / steps) * (angleEnd - angleStart);
                const r = radius + Math.sin((t / steps) * Math.PI) * (difficulty * 5 * scaleFactor);
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (t === 0 && i === 0) previewCtx.moveTo(x, y);
                else previewCtx.lineTo(x, y);
            }
        }
        previewCtx.closePath();

        // Apply gradient fill
        for (let i = 0; i < 7; i++) {
            if (i >= answers.times.length || answers.times[i] === 0) continue;
            const angleStart = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const angleEnd = ((i + 1) / 7) * 2 * Math.PI - Math.PI / 2;
            const time = answers.times[i];
            const radius = baseRadius + (time * scaleFactor);

            const gradient = previewCtx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos((angleStart + angleEnd) / 2) * radius,
                centerY + Math.sin((angleStart + angleEnd) / 2) * radius
            );
            gradient.addColorStop(0, gradientColors[i][0]);
            gradient.addColorStop(1, gradientColors[i][1]);

            previewCtx.beginPath();
            previewCtx.moveTo(centerX, centerY);
            for (let t = 0; t <= 10; t++) {
                const angle = angleStart + (t / 10) * (angleEnd - angleStart);
                const r = radius + Math.sin((t / 10) * Math.PI) * (answers.difficulties[i] * 5 * scaleFactor);
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                previewCtx.lineTo(x, y);
            }
            previewCtx.closePath();
            previewCtx.fillStyle = gradient;
            previewCtx.fill();
            previewCtx.strokeStyle = '#333';
            previewCtx.lineWidth = 1;
            previewCtx.stroke();
        }

        // Overlay time labels
        for (let i = 0; i < answers.times.length; i++) {
            if (answers.times[i] === 0) continue;
            const time = answers.times[i];
            const difficulty = answers.difficulties[i];
            const angle = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const radius = baseRadius + (time * scaleFactor) + (difficulty * 5 * scaleFactor);
            const labelX = centerX + Math.cos(angle) * (radius + 20 * scaleFactor);
            const labelY = centerY + Math.sin(angle) * (radius + 20 * scaleFactor);
            previewCtx.fillStyle = '#333';
            previewCtx.font = '8px Arial';
            previewCtx.textAlign = 'center';
            previewCtx.textBaseline = 'middle';
            previewCtx.fillText(timeLabels[time], labelX, labelY);
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

        // Calculate segment proportions (not used directly)
        const totalPoints = times.reduce((sum, val) => sum + val, 0) || 1;
        const segmentProportions = times.map(val => (val / totalPoints) * 2 * Math.PI);

        // Draw the final mastery symbol
        drawMasterySymbol(masteryProgressScore, segmentProportions, difficulties, hasHigherLevels, times, topic);

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

    // Function to draw the final mastery symbol as a Mastery Blossom
    function drawMasterySymbol(level, segmentProportions, difficulties, hasHigherLevels, times, topic) {
        const width = masteryCanvas.width;
        const height = masteryCanvas.height;
        masteryCtx.clearRect(0, 0, width, height);

        // Background sky
        masteryCtx.fillStyle = '#E6E6FA'; // Light lavender sky
        masteryCtx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const maxCanvasRadius = Math.min(width, height) / 2;
        const baseRadius = 30;

        // Determine the maximum time to scale the radius
        const maxTime = Math.max(...times, 0);
        const targetRadius = maxTime > 0 ? maxCanvasRadius - 20 : maxCanvasRadius / 2; // Leave 20px for infinity ring or padding
        const scaleFactor = maxTime > 0 ? (targetRadius - baseRadius) / maxTime : 1;

        // Check for ample time past Level 4
        const ampleTimePastLevel4 = times.slice(4).reduce((sum, val) => sum + val, 0) > 100;

        // Draw the connected blossom shape
        masteryCtx.beginPath();
        for (let i = 0; i < 7; i++) {
            const time = times[i];
            const difficulty = difficulties[i];
            const radius = time > 0 ? baseRadius + (time * scaleFactor) : baseRadius;
            const angleStart = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const angleEnd = ((i + 1) / 7) * 2 * Math.PI - Math.PI / 2;
            const steps = 20;

            for (let t = 0; t <= steps; t++) {
                const angle = angleStart + (t / steps) * (angleEnd - angleStart);
                const r = radius + Math.sin((t / steps) * Math.PI) * (difficulty * 5 * scaleFactor);
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (t === 0 && i === 0) masteryCtx.moveTo(x, y);
                else masteryCtx.lineTo(x, y);
            }
        }
        masteryCtx.closePath();

        // Apply gradient fill for each petal
        for (let i = 0; i < 7; i++) {
            const time = times[i];
            const difficulty = difficulties[i];
            const radius = time > 0 ? baseRadius + (time * scaleFactor) : baseRadius;
            const angleStart = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const angleEnd = ((i + 1) / 7) * 2 * Math.PI - Math.PI / 2;

            const gradient = masteryCtx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos((angleStart + angleEnd) / 2) * radius,
                centerY + Math.sin((angleStart + angleEnd) / 2) * radius
            );
            gradient.addColorStop(0, gradientColors[i][0]);
            gradient.addColorStop(1, gradientColors[i][1]);

            masteryCtx.beginPath();
            masteryCtx.moveTo(centerX, centerY);
            for (let t = 0; t <= 20; t++) {
                const angle = angleStart + (t / 20) * (angleEnd - angleStart);
                const r = radius + Math.sin((t / 20) * Math.PI) * (difficulty * 5 * scaleFactor);
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                masteryCtx.lineTo(x, y);
            }
            masteryCtx.closePath();
            masteryCtx.fillStyle = gradient;
            masteryCtx.fill();
            masteryCtx.strokeStyle = '#333';
            masteryCtx.lineWidth = 1;
            masteryCtx.stroke();
        }

        // Draw infinity ring if ample time past Level 4
        if (ampleTimePastLevel4) {
            masteryCtx.beginPath();
            const outerRadius = targetRadius + 20;
            const tSteps = 100;
            for (let t = 0; t <= tSteps; t++) {
                const tParam = (t / tSteps) * 2 * Math.PI;
                const r = outerRadius;
                const x = centerX + Math.cos(tParam) * r;
                const y = centerY + Math.sin(tParam) * r;
                if (t === 0) masteryCtx.moveTo(x, y);
                else masteryCtx.lineTo(x, y);
            }
            masteryCtx.closePath();
            masteryCtx.strokeStyle = '#D2B48C'; // Tan infinity ring
            masteryCtx.lineWidth = 5;
            masteryCtx.stroke();
        }

        // Overlay time and level labels within bounds
        for (let i = 0; i < 7; i++) {
            const time = times[i];
            const difficulty = difficulties[i];
            const radius = time > 0 ? baseRadius + (time * scaleFactor) : baseRadius;
            const angleStart = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const angleEnd = ((i + 1) / 7) * 2 * Math.PI - Math.PI / 2;
            const labelAngle = (angleStart + angleEnd) / 2;

            // Time label
            if (time > 0) {
                const labelRadius = Math.min(radius * 0.7, targetRadius - 20); // Position within petal, not exceeding bounds
                const labelX = centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = centerY + Math.sin(labelAngle) * labelRadius;
                masteryCtx.fillStyle = '#333';
                masteryCtx.font = `${Math.max(8, 10)}px Arial`;
                masteryCtx.textAlign = 'center';
                masteryCtx.textBaseline = 'middle';
                masteryCtx.fillText(timeLabels[time], labelX, labelY);
            }

            // Level label
            const levelLabelRadius = Math.max(baseRadius * 1.2, radius * 0.3); // Closer to center, within petal
            const levelLabelX = centerX + Math.cos(labelAngle) * levelLabelRadius;
            const levelLabelY = centerY + Math.sin(labelAngle) * levelLabelRadius;
            masteryCtx.fillStyle = '#333';
            masteryCtx.font = `${Math.max(8, 10 )}px Arial`;
            masteryCtx.textAlign = 'center';
            masteryCtx.textBaseline = 'middle';
            masteryCtx.fillText(`Level ${i + 1}`, levelLabelX, levelLabelY);
        }

        // Add title at the top with high contrast and discipline
        const titleText = `${topic} Mastery Progress: ${level}`;
        masteryCtx.font = 'bold 24px Georgia, Arial, sans-serif'; // More elegant font
        masteryCtx.textAlign = 'center';
        masteryCtx.textBaseline = 'middle';
        const titleX = centerX;
        const titleY = centerY - targetRadius - 10; // Position above the blossom

        // Add shadow for contrast instead of background
        masteryCtx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        masteryCtx.shadowBlur = 5;
        masteryCtx.shadowOffsetX = 2;
        masteryCtx.shadowOffsetY = 2;
        masteryCtx.fillStyle = '#333';
        masteryCtx.fillText(titleText, titleX, titleY);

        // Reset shadow for other elements
        masteryCtx.shadowColor = 'transparent';
        masteryCtx.shadowBlur = 0;
        masteryCtx.shadowOffsetX = 0;
        masteryCtx.shadowOffsetY = 0;
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
