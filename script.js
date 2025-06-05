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
    const textColorPicker = document.getElementById('text-color-picker');
    const previewCtx = previewCanvas.getContext('2d');
    const masteryCtx = masteryCanvas.getContext('2d');
    const tooltip = document.getElementById('tooltip');
    let currentQuestion = 0;
    let answers = { times: [], difficulties: [] };
    let petalRegions = []; // Store petal regions for hover detection
    let resultData = {}; // Store form results for redrawing

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

    // Function to convert RGB to HSL and adjust hue
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 360, s * 100, l * 100];
    }

    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }

    function rgbToHex(r, g, b) {
        return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }

    // Function to generate analogous colors
    function generateAnalogousColors(baseColor) {
        const rgb = hexToRgb(baseColor);
        const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        const colors = [];
        for (let i = -2; i <= 2; i++) {
            const newH = (h + i * 30 + 360) % 360; // Shift hue by ±30 degrees
            const newRgb = hslToRgb(newH, s, l);
            colors.push(rgbToHex(newRgb[0], newRgb[1], newRgb[2]));
        }
        return colors; // Returns 5 colors: -60, -30, 0, +30, +60 degrees
    }

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

        // Apply analogous colors with dynamic sizes
        const baseColor = form.querySelector('input[name="passion-color"]').value || '#2C69CE';
        const analogousColors = generateAnalogousColors(baseColor);
        const times = Array(7).fill(0);
        const diffs = Array(7).fill(1);
        for (let i = 0; i < answers.times.length; i++) {
            times[i] = answers.times[i];
            diffs[i] = answers.difficulties[i];
        }

        for (let i = 0; i < 7; i++) {
            if (i >= answers.times.length || answers.times[i] === 0) continue;
            const angleStart = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const angleEnd = ((i + 1) / 7) * 2 * Math.PI - Math.PI / 2;
            const time = answers.times[i];
            const radius = baseRadius + (time * scaleFactor);
            const colorIndex = i % analogousColors.length;

            const gradient = previewCtx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos((angleStart + angleEnd) / 2) * radius,
                centerY + Math.sin((angleStart + angleEnd) / 2) * radius
            );
            gradient.addColorStop(0, analogousColors[colorIndex]);
            gradient.addColorStop(1, analogousColors[colorIndex]); // Solid color for simplicity

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

        // Overlay time labels with default color (black for preview)
        for (let i = 0; i < answers.times.length; i++) {
            if (answers.times[i] === 0) continue;
            const time = answers.times[i];
            const difficulty = answers.difficulties[i];
            const angle = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const radius = baseRadius + (time * scaleFactor) + (difficulty * 5 * scaleFactor);
            const labelX = centerX + Math.cos(angle) * (radius + 20 * scaleFactor);
            const labelY = centerY + Math.sin(angle) * (radius + 20 * scaleFactor);
            previewCtx.fillStyle = '#333'; // Default black for preview
            previewCtx.font = '12px Arial';
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

    // Function to draw the final mastery symbol as a Mastery Blossom
    function drawMasterySymbol(level, segmentProportions, difficulties, hasHigherLevels, times, topic, passionColor, textColor) {
        const width = masteryCanvas.width;
        const height = masteryCanvas.height;
        masteryCtx.clearRect(0, 0, width, height);
        petalRegions = []; // Reset petal regions

        // Background sky
        masteryCtx.fillStyle = '#E6E6FA'; // Light lavender sky
        masteryCtx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const maxCanvasRadius = Math.min(width, height) / 2;
        const baseRadius = 30;

        // Determine the maximum time to scale the radius
        const maxTime = Math.max(...times, 0);
        const targetRadius = maxTime > 0 ? maxCanvasRadius - 20 : maxCanvasRadius / 2;
        const scaleFactor = maxTime > 0 ? (targetRadius - baseRadius) / maxTime : 1;

        // Check for ample time past Level 4
        const ampleTimePastLevel4 = times.slice(4).reduce((sum, val) => sum + val, 0) > 100;

        // Generate analogous colors based on passion color
        const analogousColors = generateAnalogousColors(passionColor || '#2C69CE');

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

        // Apply analogous colors for each petal and store regions
        for (let i = 0; i < 7; i++) {
            const time = times[i];
            const difficulty = difficulties[i];
            const radius = time > 0 ? baseRadius + (time * scaleFactor) : baseRadius;
            const angleStart = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const angleEnd = ((i + 1) / 7) * 2 * Math.PI - Math.PI / 2;
            const colorIndex = i % analogousColors.length;

            const gradient = masteryCtx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos((angleStart + angleEnd) / 2) * radius,
                centerY + Math.sin((angleStart + angleEnd) / 2) * radius
            );
            gradient.addColorStop(0, analogousColors[colorIndex]);
            gradient.addColorStop(1, analogousColors[colorIndex]); // Solid color for simplicity

            masteryCtx.beginPath();
            masteryCtx.moveTo(centerX, centerY);
            const petalPath = new Path2D();
            petalPath.moveTo(centerX, centerY);
            for (let t = 0; t <= 20; t++) {
                const angle = angleStart + (t / 20) * (angleEnd - angleStart);
                const r = radius + Math.sin((t / 20) * Math.PI) * (difficulty * 5 * scaleFactor);
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                masteryCtx.lineTo(x, y);
                petalPath.lineTo(x, y);
            }
            masteryCtx.closePath();
            petalPath.closePath();
            masteryCtx.fillStyle = gradient;
            masteryCtx.fill();
            masteryCtx.strokeStyle = '#333';
            masteryCtx.lineWidth = 1;
            masteryCtx.stroke();

            // Store petal region for hover detection
            petalRegions.push({
                path: petalPath,
                level: i + 1,
                time: timeLabels[times[i]],
                difficulty: difficulties[i],
                radius: radius,
                angleStart: angleStart,
                angleEnd: angleEnd
            });
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
            masteryCtx.strokeStyle = '#D2B48C';
            masteryCtx.lineWidth = 5;
            masteryCtx.stroke();
        }

        // Overlay time and level labels within bounds using selected text color
        for (let i = 0; i < 7; i++) {
            const time = times[i];
            const difficulty = difficulties[i];
            const radius = time > 0 ? baseRadius + (time * scaleFactor) : baseRadius;
            const angleStart = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const angleEnd = ((i + 1) / 7) * 2 * Math.PI - Math.PI / 2;
            const labelAngle = (angleStart + angleEnd) / 2;

            // Time label (only if petal is large enough)
            if (time > 0 && radius > baseRadius + 20 * scaleFactor) {
                const labelRadius = Math.min(radius * 0.7, targetRadius - 20);
                const labelX = centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = centerY + Math.sin(labelAngle) * labelRadius;
                masteryCtx.fillStyle = textColor || '#333333';
                masteryCtx.font = `${Math.max(8, 10 * scaleFactor)}px Arial`;
                masteryCtx.textAlign = 'center';
                masteryCtx.textBaseline = 'middle';
                masteryCtx.fillText(timeLabels[time], labelX, labelY);
            }

            // Level label (always show, closer to center)
            const levelLabelRadius = Math.max(baseRadius * 1.2, radius * 0.3);
            const levelLabelX = centerX + Math.cos(labelAngle) * levelLabelRadius;
            const levelLabelY = centerY + Math.sin(labelAngle) * levelLabelRadius;
            masteryCtx.fillStyle = textColor || '#333333';
            masteryCtx.font = `${Math.max(6, 8 * scaleFactor)}px Arial`;
            masteryCtx.textAlign = 'center';
            masteryCtx.textBaseline = 'middle';
            masteryCtx.fillText(`Level ${i + 1}`, levelLabelX, levelLabelY);
        }

        // Add title at the top with selected text color
        const titleText = `${topic} Mastery Progress: ${level}`;
        masteryCtx.font = 'bold 24px Georgia, Arial, sans-serif';
        masteryCtx.textAlign = 'center';
        masteryCtx.textBaseline = 'middle';
        const titleX = centerX;
        const titleY = centerY - targetRadius - 10;

        // Add shadow for better visibility
        masteryCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        masteryCtx.shadowBlur = 5;
        masteryCtx.shadowOffsetX = 2;
        masteryCtx.shadowOffsetY = 2;
        masteryCtx.fillStyle = textColor || '#333333';
        masteryCtx.fillText(titleText, titleX, titleY);

        // Reset shadow
        masteryCtx.shadowColor = 'transparent';
        masteryCtx.shadowBlur = 0;
        masteryCtx.shadowOffsetX = 0;
        masteryCtx.shadowOffsetY = 0;
    }

    // Form submission and result calculation
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const topic = formData.get('mastery-topic');
        const passionColor = formData.get('passion-color');
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

        // Store result data for redrawing
        resultData = {
            level: masteryProgressScore,
            segmentProportions: times.map(val => (val / (times.reduce((sum, v) => sum + v, 0) || 1)) * 2 * Math.PI),
            difficulties,
            hasHigherLevels,
            times,
            topic,
            passionColor
        };

        // Display results
        formSection.style.display = 'none';
        resultSection.style.display = 'block';
        document.getElementById('result-topic').textContent = topic;
        document.getElementById('result-level').textContent = masteryProgressScore;
        document.getElementById('result-tier').textContent = tier;

        // Draw the final mastery symbol with initial text color
        drawMasterySymbol(
            resultData.level,
            resultData.segmentProportions,
            resultData.difficulties,
            resultData.hasHigherLevels,
            resultData.times,
            resultData.topic,
            resultData.passionColor,
            textColorPicker.value
        );

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
            ? `As an Advanced Learner, deepen your Contribution (Level 6) through publications or titles, or aim for Innovation (Level 7, like Newton’s calculus). Consider a project that pushes the boundaries of ${topic}.`
            : `As a Tier One Candidate, build your foundation with General Education (Level 2) and Experience (Level 3). Seek challenges to reach Extending the Passion (Level 4) by sharing your love for ${topic}.`;
        document.getElementById('next-steps').textContent = nextSteps;
    });

    // Redraw canvas when text color changes
    textColorPicker.addEventListener('input', () => {
        if (resultData.level !== undefined) {
            drawMasterySymbol(
                resultData.level,
                resultData.segmentProportions,
                resultData.difficulties,
                resultData.hasHigherLevels,
                resultData.times,
                resultData.topic,
                resultData.passionColor,
                textColorPicker.value
            );
        }
    });

    // Tooltip handling for smaller petals
    masteryCanvas.addEventListener('mousemove', (e) => {
        const rect = masteryCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let tooltipShown = false;

        for (const region of petalRegions) {
            const radius = region.radius;
            const baseRadius = 30; // From drawMasterySymbol
            const maxTime = Math.max(...petalRegions.map(r => r.radius), baseRadius);
            const scaleFactor = maxTime > baseRadius ? (maxTime - baseRadius) / maxTime : 1;

            // Show tooltip if petal radius is small
            if (radius < baseRadius + 20 * scaleFactor && masteryCtx.isPointInPath(region.path, x, y)) {
                tooltip.innerHTML = `Level ${region.level}<br>Time: ${region.time}<br>Difficulty: ${region.difficulty}`;
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.clientX - rect.left + 15}px`;
                tooltip.style.top = `${e.clientY - rect.top - 30}px`;
                tooltipShown = true;
                break;
            }
        }

        if (!tooltipShown) {
            tooltip.style.display = 'none';
        }
    });

    masteryCanvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });

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
        resultData = {};
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