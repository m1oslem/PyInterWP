document.addEventListener('DOMContentLoaded', function() {
    // إعداد محرر الكود باستخدام CodeMirror
    const codeEditor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'python',
        theme: 'default',
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: true,
        rtlMoveVisually: true
    });

    // تعريف المتغيرات العامة
    let exerciseTitle = 'محرر بايثون التفاعلي';
    let initialCode = 'import numpy as np\n\n# أنشئ مصفوفة من 1 إلى 10\narr = np.arange(1, 11)\n\n# احسب مجموع المصفوفة\nprint(np.sum(arr))';

    // تحميل بيانات التمرين من السمات المخصصة (إذا وجدت)
    function loadExerciseData() {
        const container = document.querySelector('.python-editor-container');
        if (container) {
            if (container.dataset.title) {
                exerciseTitle = container.dataset.title;
                document.getElementById('exercise-title').textContent = exerciseTitle;
            }
            
            if (container.dataset.code) {
                initialCode = container.dataset.code;
                codeEditor.setValue(initialCode);
            }
        }
    }

    // تحميل بيانات التمرين
    loadExerciseData();

    // إضافة مستمع الحدث لزر التشغيل
    document.getElementById('run-button').addEventListener('click', function() {
        runCode();
    });

    // دالة لتنفيذ الكود
    function runCode() {
        const code = codeEditor.getValue();
        const outputText = document.getElementById('output-text');
        const loadingIndicator = document.getElementById('loading-indicator');
        
        // إظهار مؤشر التحميل
        loadingIndicator.style.display = 'flex';
        outputText.textContent = 'جاري تنفيذ الكود...';
        
        // إرسال الكود إلى الخادم للتنفيذ
        fetch('/run-python', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: code }),
        })
        .then(response => response.json())
        .then(data => {
            // إخفاء مؤشر التحميل
            loadingIndicator.style.display = 'none';
            
            // عرض النتائج
            if (data.error) {
                outputText.textContent = 'خطأ: ' + data.error;
            } else {
                outputText.textContent = data.output || 'لا توجد مخرجات';
            }
        })
        .catch(error => {
            loadingIndicator.style.display = 'none';
            outputText.textContent = 'حدث خطأ في الاتصال بالخادم: ' + error.message;
        });
    }
});
