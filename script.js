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
    
    // إضافة مستمع حدث لزر رفع الملفات
    document.getElementById('upload-button').addEventListener('click', function() {
        document.getElementById('file-upload').click();
    });
    
    // إضافة مستمع حدث لتغيير الملف المرفوع
    document.getElementById('file-upload').addEventListener('change', function(event) {
        handleFileUpload(event);
    });
    
    // دالة للتعامل مع رفع الملفات
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileList = document.getElementById('file-list');
        const uploadedFilesContainer = document.getElementById('uploaded-files-container');
        const imagePreview = document.getElementById('image-preview');
        
        // إظهار حاوية الملفات المرفوعة
        uploadedFilesContainer.style.display = 'block';
        
        // إنشاء عنصر جديد للملف
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // إضافة اسم الملف
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        fileItem.appendChild(fileName);
        
        // إضافة أزرار الإجراءات
        const fileActions = document.createElement('div');
        fileActions.className = 'file-actions';
        
        // زر استخدام الملف
        const useButton = document.createElement('button');
        useButton.className = 'file-action-button use';
        useButton.innerHTML = '<i class="fas fa-code"></i>';
        useButton.title = 'استخدام في الكود';
        useButton.addEventListener('click', function() {
            useFileInCode(file);
        });
        fileActions.appendChild(useButton);
        
        // زر حذف الملف
        const deleteButton = document.createElement('button');
        deleteButton.className = 'file-action-button delete';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'حذف الملف';
        deleteButton.addEventListener('click', function() {
            fileItem.remove();
            imagePreview.innerHTML = '';
            if (fileList.children.length === 0) {
                uploadedFilesContainer.style.display = 'none';
            }
        });
        fileActions.appendChild(deleteButton);
        
        fileItem.appendChild(fileActions);
        fileList.appendChild(fileItem);
        
        // عرض معاينة الصورة إذا كان الملف صورة
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.innerHTML = '';
        }
        
        // إعادة تعيين حقل الملف
        event.target.value = '';
    }
    
    // دالة لاستخدام الملف في الكود
    function useFileInCode(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            let fileContent = e.target.result;
            let codeToInsert = '';
            
            if (file.type.startsWith('image/')) {
                // إذا كان الملف صورة، أضف كود لفتح الصورة باستخدام OpenCV أو PIL
                codeToInsert = `
# استيراد المكتبات اللازمة للتعامل مع الصور
import numpy as np
from PIL import Image
import io

# تحميل الصورة من الملف المرفوع
image_data = """${fileContent}"""
image_bytes = io.BytesIO(image_data.encode('utf-8').split(b',')[1])
img = Image.open(image_bytes)

# عرض معلومات الصورة
print(f"حجم الصورة: {img.size}")
print(f"وضع الصورة: {img.mode}")

# يمكنك إجراء المزيد من العمليات على الصورة هنا
# مثال: تحويل الصورة إلى مصفوفة NumPy
img_array = np.array(img)
print(f"شكل مصفوفة الصورة: {img_array.shape}")
`;
            } else if (file.name.endsWith('.py')) {
                // إذا كان ملف بايثون، أضف استيراد للملف
                codeToInsert = `
# استيراد الكود من الملف المرفوع
${fileContent}
`;
            } else if (file.name.endsWith('.csv')) {
                // إذا كان ملف CSV، أضف كود لقراءة البيانات
                codeToInsert = `
# استيراد المكتبات اللازمة للتعامل مع ملفات CSV
import pandas as pd
import io

# قراءة بيانات CSV من الملف المرفوع
csv_data = """${fileContent}"""
df = pd.read_csv(io.StringIO(csv_data))

# عرض البيانات
print(df.head())
print(f"عدد الصفوف: {df.shape[0]}")
print(f"عدد الأعمدة: {df.shape[1]}")
`;
            } else {
                // للملفات النصية العادية
                codeToInsert = `
# قراءة البيانات من الملف المرفوع
file_content = """${fileContent}"""

# عرض محتوى الملف
print(file_content)
`;
            }
            
            // إدراج الكود في المحرر
            codeEditor.setValue(codeToInsert);
        };
        
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    }
    
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
