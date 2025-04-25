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
    let exerciseTitle = 'استخدام NumPy لإنشاء مصفوفة';
    let initialCode = 'import numpy as np\n\n# أنشئ مصفوفة من 1 إلى 10\narr = np.arange(1, 11)\n\n# احسب مجموع المصفوفة\nprint(np.sum(arr))';
    let hintText = 'استخدم دالة np.arange() لإنشاء مصفوفة من 1 إلى 10';
    let solutionCode = 'import numpy as np\n\n# أنشئ مصفوفة من 1 إلى 10\narr = np.arange(1, 11)\n\n# احسب مجموع المصفوفة\nprint(np.sum(arr))';
    let expectedOutput = '55';

    // تحميل بيانات التمرين من السمات المخصصة (إذا وجدت)
    function loadExerciseData() {
        const container = document.querySelector('.python-editor-container');
        if (container) {
            if (container.dataset.title) {
                exerciseTitle = container.dataset.title;
                document.getElementById('exercise-title').textContent = 'التمرين: ' + exerciseTitle;
            }
            
            if (container.dataset.code) {
                initialCode = container.dataset.code;
                codeEditor.setValue(initialCode);
            }
            
            if (container.dataset.hint) {
                hintText = container.dataset.hint;
                document.getElementById('hint-text').textContent = hintText;
            }
            
            if (container.dataset.solution) {
                solutionCode = container.dataset.solution;
            }
            
            if (container.dataset.expectedOutput) {
                expectedOutput = container.dataset.expectedOutput;
            }
        }
    }

    // تحميل بيانات التمرين
    loadExerciseData();

    // إضافة مستمعي الأحداث للأزرار
    document.getElementById('hint-button').addEventListener('click', function() {
        const hintContainer = document.getElementById('hint-container');
        if (hintContainer.style.display === 'none') {
            hintContainer.style.display = 'block';
        } else {
            hintContainer.style.display = 'none';
        }
    });

    document.getElementById('solution-button').addEventListener('click', function() {
        codeEditor.setValue(solutionCode);
    });

    document.getElementById('run-button').addEventListener('click', function() {
        runCode();
    });

    // دالة لتنفيذ الكود
    function runCode() {
        const code = codeEditor.getValue();
        const outputText = document.getElementById('output-text');
        const loadingIndicator = document.getElementById('loading-indicator');
        const validationResult = document.getElementById('validation-result');
        
        // إظهار مؤشر التحميل
        loadingIndicator.style.display = 'flex';
        outputText.textContent = 'جاري تنفيذ الكود...';
        validationResult.textContent = '';
        validationResult.className = 'validation-result';
        
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
                validationResult.textContent = 'هناك خطأ في الكود. حاول مرة أخرى.';
                validationResult.className = 'validation-result error';
            } else {
                outputText.textContent = data.output || 'لا توجد مخرجات';
                
                // التحقق من صحة الحل
                const output = data.output.trim();
                if (output === expectedOutput) {
                    validationResult.innerHTML = '<i class="fas fa-check-circle"></i> صحيح! الحل الخاص بك يطابق المخرجات المتوقعة.';
                    validationResult.className = 'validation-result success';
                } else {
                    validationResult.innerHTML = '<i class="fas fa-times-circle"></i> غير صحيح. المخرجات المتوقعة هي: ' + expectedOutput;
                    validationResult.className = 'validation-result error';
                }
            }
        })
        .catch(error => {
            loadingIndicator.style.display = 'none';
            outputText.textContent = 'حدث خطأ في الاتصال بالخادم: ' + error.message;
            validationResult.textContent = '';
            validationResult.className = 'validation-result';
        });
    }

    // محاكاة تنفيذ الكود محليًا (للعرض فقط)
    function simulateCodeExecution() {
        const runButton = document.getElementById('run-button');
        const originalRunCode = runCode;
        
        // استبدال دالة تنفيذ الكود بمحاكاة محلية
        runCode = function() {
            const code = codeEditor.getValue();
            const outputText = document.getElementById('output-text');
            const loadingIndicator = document.getElementById('loading-indicator');
            const validationResult = document.getElementById('validation-result');
            
            loadingIndicator.style.display = 'flex';
            outputText.textContent = 'جاري تنفيذ الكود...';
            validationResult.textContent = '';
            validationResult.className = 'validation-result';
            
            // محاكاة وقت التنفيذ
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
                
                // محاكاة النتائج بناءً على الكود
                if (code.includes('np.arange') && code.includes('np.sum')) {
                    outputText.textContent = '55';
                    validationResult.innerHTML = '<i class="fas fa-check-circle"></i> صحيح! الحل الخاص بك يطابق المخرجات المتوقعة.';
                    validationResult.className = 'validation-result success';
                } else {
                    outputText.textContent = 'Error: Invalid syntax or missing functions';
                    validationResult.innerHTML = '<i class="fas fa-times-circle"></i> غير صحيح. تأكد من استخدام الدوال المناسبة.';
                    validationResult.className = 'validation-result error';
                }
            }, 1000);
        };
        
        // إضافة تعليق للإشارة إلى أن هذه محاكاة
        console.log('تم تفعيل وضع المحاكاة المحلية للعرض فقط');
    }

    // تفعيل المحاكاة المحلية للعرض (يمكن إزالتها عند تنفيذ الخادم الفعلي)
    simulateCodeExecution();
});