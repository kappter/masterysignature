document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mastery-form');
    const questions = document.querySelectorAll('.question');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formSection = document.getElementById('form-section');
    const resultSection = document.getElementById('result-section');
    const canvas = document.getElementById('mastery-canvas');
    const ctx = canvas.getContext('2d');
    let currentQuestion = 0;

    // Chakra colors
    const chakraColors = [
        '#FF0000', // Red (Root)
        '#FF4500', // Orange (Sacral)
        '#FFFF00', // Yellow (Solar Plexus)
        '#00FF00', // Green (Heart)
        '#0000FF', // Blue (Throat)
        '#4B0082', // Indigo (Third Eye)
        '#EE82EE'  // Violet (Crown)
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
        const currentInput = questions[currentQuestion].querySelector('input, select');
        if (currentInput.value) {
            if (currentQuestion < questions.length - 1) {
                currentQuestion++;
                showQuestion(currentQuestion);
            }
        } else {
            alert('Please answer the question before proceeding.');
        }
    });

    // Form submission and result calculation
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const topic = formData.get('mastery-topic');
        const answers = [
            parseInt(formData.get('q1')),
            parseInt(formData.get('q2')),
            parseInt(formData.get('q3')),
            parseInt(formData.get('q4')),
            parseInt(formData.get('q5')),
            parseInt(formData.get('q6')),
            parseInt(formData.get('q7'))
        ];
        const challenge = parseInt(formData.get('challenge'));

        // Calculate average mastery level
        const total = answers.reduce((sum, val) => sum + val, 0);
        const averageLevel = Math.round(total / answers.length);

        // Display results
        formSection.style.display = 'none';
        resultSection.style.display = 'block';
        document.getElementById('result-topic').textContent = topic;
        document.getElementById('result-level').textContent = averageLevel;

        // Display the most challenging aspect
        const challengeLabels = [
            'Time Spent Working',
            'General Education',
            'Experience',
            'Sharing',
            'Amalgamating',
            'Contributing',
            'Next Thing'
        ];
        document.getElementById('result-challenge').textContent = challengeLabels[challenge - 1];

        // Calculate segment lengths proportional to answers
        const totalPoints = answers.reduce((sum, val) => sum + val, 0);
        const segmentLengths = answers.map(val => (val / totalPoints) * 100); // Percentage of total

        // Draw the colored line on the canvas
        drawMasterySymbol(averageLevel, segmentLengths, challenge);

        // Future projections
        const projectLevel = (years) => {
            const growthRate = 0.1; // 0.1 level increase per year
            return Math.min(7, Math.round(averageLevel + growthRate * years));
        };

        document.getElementById('proj-1-year').textContent = projectLevel(1);
        document.getElementById('proj-5-years').textContent = projectLevel(5);
        document.getElementById('proj-10-years').textContent = projectLevel(10);
        document.getElementById('proj-25-years').textContent = projectLevel(25);
        document.getElementById('proj-50-years').textContent = projectLevel(50);
    });

    // Function to draw the mastery symbol (circle or infinity)
    function drawMasterySymbol(level, segmentLengths, challenge) {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Center of the canvas
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 80; // Radius for circle or half-width of infinity loops

        // Total length of the path (approximated as circumference for simplicity)
        const totalLength = level <= 3 ? 2 * Math.PI * radius : 4 * Math.PI * radius; // Infinity path is roughly twice as long
        const segments = segmentLengths.map(len => (len / 100) * totalLength);

        // Rotation angle based on the challenging aspect (position it "uphill")
        const challengeIndex = challenge - 1;
        const totalSegments = segmentLengths.reduce((sum, len) => sum + len, 0);
        let challengeStart = 0;
        for (let i = 0; i < challengeIndex; i++) {
            challengeStart += (segmentLengths[i] / totalSegments) * (level <= 3 ? 2 * Math.PI : 4 * Math.PI);
        }
        const rotationAngle = -challengeStart + Math.PI / 2; // Adjust to make challenge "uphill"

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationAngle);

        if (level <= 3) {
            // Draw a circle for levels 1-3
            let startAngle = 0;
            for (let i = 0; i < segments.length; i++) {
                const segmentAngle = (segments[i] / totalLength) * 2 * Math.PI;
                ctx.beginPath();
                ctx.arc(0, 0, radius, startAngle, startAngle + segmentAngle);
                ctx.lineWidth = 10;
                ctx.strokeStyle = chakraColors[i];
                ctx.lineCap = 'butt';
                ctx.stroke();
                startAngle += segmentAngle;
            }
        } else {
            // Draw an infinity symbol for levels 4-7
            let currentLength = 0;
            const totalPathLength = 4 * Math.PI * radius; // Approximate length of infinity path
            const numPoints = 360; // Number of points to approximate the infinity curve
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
                    if (currentLength <= accumulatedLength) {
                        segmentIndex = j;
                        break;
                    }
                }

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(nextX, nextY);
                ctx.lineWidth = 10;
                ctx.strokeStyle = chakraColors[segmentIndex];
                ctx.lineCap = 'butt';
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // Initialize first question
    showQuestion(currentQuestion);
});
