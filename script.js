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
        const currentInputs = questions[currentQuestion].querySelectorAll('select');
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

    // Function to draw the preview as the user answers
    function drawPreview() {
        const width = previewCanvas.width;
        const height = previewCanvas.height;
        previewCtx.clearRect(0, 0, width, height);

        // Center of the canvas
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 80;

        // Calculate current level based on answered questions
        const answeredTimes = answers.times.slice(0, currentQuestion - 1);
        const total = answeredTimes.reduce((sum, val) => sum + val, 0);
        const averageLevel = answeredTimes.length ? Math.round(total / answeredTimes.length) : 0;

        // Calculate segment lengths
        const totalPoints = answeredTimes.reduce((sum, val) => sum + val, 0) || 1; // Avoid division by zero
        const segmentLengths = answeredTimes.map(val => (val / totalPoints) * 100);

        // Determine if it's a circle or infinity symbol
        const hasHigherLevels = answeredTimes.some((time, idx) => idx >= 3 && time > 0);
        const totalLength = (averageLevel <= 3 || !hasHigherLevels) ? 2 * Math.PI * radius : 4 * Math.PI * radius;
        const segments = segmentLengths.map(len => (len / 100) * totalLength);

        previewCtx.save();
        previewCtx.translate(centerX, centerY);

        if (averageLevel <= 3 || !hasHigherLevels) {
            // Draw a circle
            let startAngle = 0;
            for (let i = 0; i < segments.length; i++) {
                if (answeredTimes[i] === 0) continue; // Skip zero-length segments
                const segmentAngle = (segments[i] / totalLength) * 2 * Math.PI;
                previewCtx.beginPath();
                previewCtx.arc(0, 0, radius, startAngle, startAngle + segmentAngle);
                previewCtx.lineWidth = 10 * (answers.difficulties[i] / 5); // Thickness based on difficulty
                previewCtx.strokeStyle = chakraColors[i];
                previewCtx.lineCap = 'butt';
                previewCtx.stroke();
                startAngle += segmentAngle;
            }
        } else {
            // Draw an infinity symbol
            let currentLength = 0;
            const totalPathLength = 4 * Math.PI * radius;
            const numPoints = 360;
            const step = totalPathLength / numPoints;

            for (let i = 0; i < numPoints; i++) {
                const t = (i / numPoints) * 2 * Math.PI;
                const x = radius * Math.cos(t);
                const y = radius * Math.sin(t) * Math.sin(t / 2);

                const nextT = ((i + 1) / numPoints) * 2 * Math.PI;
                const nextX = radius * Math.cos(nextT);
                const nextY = radius * Math.sin(nextT) * Math.sin(nextT / 2);

                // Determine which segment this point falls into
                currentLength += Math.sqrt((nextX - x) ** 2 + (nextY - y) ** 2);
                let segmentIndex = 0;
                let accumulatedLength = 0;
                for (let j = 0; j < segments.length; j++) {
                    accumulatedLength += segments[j];
                    if (currentLength <= accumulatedLength && answeredTimes[j] > 0) {
                        segmentIndex = j;
                        break;
                    }
                }

                if (answeredTimes[segmentIndex] === 0) continue;

                previewCtx.beginPath();
                previewCtx.moveTo(x, y);
                previewCtx.lineTo(nextX, nextY);
                previewCtx.lineWidth = 10 * (answers.difficulties[segmentIndex] / 5);
                previewCtx.strokeStyle = chakraColors[segmentIndex];
                previewCtx.lineCap = 'butt';
                previewCtx.stroke();
            }
        }

        previewCtx.restore();
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
        const tier = (averageLevel <= 3 || !hasHigherLevels) ? 'Tier One Candidate' : 'Advanced Learner';

        // Display results
        formSection.style.display = 'none';
        resultSection.style.display = 'block';
        document.getElementById('result-topic').textContent = topic;
        document.getElementById('result-level').textContent = averageLevel;
        document.getElementById('result-tier').textContent = tier;

        // Calculate segment lengths
        const totalPoints = times.reduce((sum, val) => sum + val, 0) || 1;
        const segmentLengths = times.map(val => (val / totalPoints) * 100);

        // Draw the final mastery symbol
        drawMasterySymbol(averageLevel, segmentLengths, difficulties, hasHigherLevels);

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

    // Function to draw the final mastery symbol
    function drawMasterySymbol(level, segmentLengths, difficulties, hasHigherLevels) {
        const width = masteryCanvas.width;
        const height = masteryCanvas.height;
        masteryCtx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 80;

        const totalLength = (level <= 3 || !hasHigherLevels) ? 2 * Math.PI * radius : 4 * Math.PI * radius;
        const segments = segmentLengths.map(len => (len / 100) * totalLength);

        masteryCtx.save();
        masteryCtx.translate(centerX, centerY);

        if (level <= 3 || !hasHigherLevels) {
            // Draw a circle
            let startAngle = 0;
            for (let i = 0; i < segments.length; i++) {
                if (segments[i] === 0) continue;
                const segmentAngle = (segments[i] / totalLength) * 2 * Math.PI;
                masteryCtx.beginPath();
                masteryCtx.arc(0, 0, radius, startAngle, startAngle + segmentAngle);
                masteryCtx.lineWidth = 10 * (difficulties[i] / 5);
                masteryCtx.strokeStyle = chakraColors[i];
                masteryCtx.lineCap = 'butt';
                masteryCtx.stroke();
                startAngle += segmentAngle;
            }
        } else {
            // Draw an infinity symbol
            let currentLength = 0;
            const totalPathLength = 4 * Math.PI * radius;
            const numPoints = 360;
            const step = totalPathLength / numPoints;

            for (let i = 0; i < numPoints; i++) {
                const t = (i / numPoints) * 2 * Math.PI;
                const x = radius * Math.cos(t);
                const y = radius * Math.sin(t) * Math.sin(t / 2);

                const nextT = ((i + 1) / numPoints) * 2 * Math.PI;
                const nextX = radius * Math.cos(nextT);
                const nextY = radius * Math.sin(nextT) * Math.sin(nextT / 2);

                currentLength += Math.sqrt((nextX - x) ** 2 + (nextY - y) ** 2);
                let segmentIndex = 0;
                let accumulatedLength = 0;
                for (let j = 0; j < segments.length; j++) {
                    accumulatedLength += segments[j];
                    if (currentLength <= accumulatedLength && segments[j] > 0) {
                        segmentIndex = j;
                        break;
                    }
                }

                if (segments[segmentIndex] === 0) continue;

                masteryCtx.beginPath();
                masteryCtx.moveTo(x, y);
                masteryCtx.lineTo(nextX, nextY);
                masteryCtx.lineWidth = 10 * (difficulties[segmentIndex] / 5);
                masteryCtx.strokeStyle = chakraColors[segmentIndex];
                masteryCtx.lineCap = 'butt';
                masteryCtx.stroke();
            }
        }

        masteryCtx.restore();
    }

    // Initialize first question
    showQuestion(currentQuestion);
});
