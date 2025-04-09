document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mastery-form');
    const questions = document.querySelectorAll('.question');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formSection = document.getElementById('form-section');
    const resultSection = document.getElementById('result-section');
    let currentQuestion = 0;

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

        // Calculate average mastery level
        const total = answers.reduce((sum, val) => sum + val, 0);
        const averageLevel = Math.round(total / answers.length);

        // Display results
        formSection.style.display = 'none';
        resultSection.style.display = 'block';
        document.getElementById('result-topic').textContent = topic;
        document.getElementById('result-level').textContent = averageLevel;

        // Position marker on infinity symbol
        const marker = document.getElementById('level-marker');
        const positions = [
            { top: '10%', left: '10%' },  // Level 1
            { top: '30%', left: '30%' },  // Level 2
            { top: '50%', left: '50%' },  // Level 3
            { top: '70%', left: '70%' },  // Level 4
            { top: '70%', left: '30%' },  // Level 5
            { top: '30%', left: '70%' },  // Level 6
            { top: '90%', left: '50%' }   // Level 7
        ];
        const pos = positions[averageLevel - 1];
        marker.style.top = pos.top;
        marker.style.left = pos.left;

        // Future projections (simple linear growth assumption)
        const projectLevel = (years) => {
            const growthRate = 0.1; // Assume 0.1 level increase per year
            const projected = Math.min(7, Math.round(averageLevel + growthRate * years));
            return projected;
        };

        document.getElementById('proj-1-year').textContent = projectLevel(1);
        document.getElementById('proj-5-years').textContent = projectLevel(5);
        document.getElementById('proj-10-years').textContent = projectLevel(10);
        document.getElementById('proj-25-years').textContent = projectLevel(25);
        document.getElementById('proj-50-years').textContent = projectLevel(50);
    });

    // Initialize first question
    showQuestion(currentQuestion);
});
