from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # تأكد من تثبيت هذه المكتبة: pip install flask-cors
import subprocess
import tempfile
import os
import sys
import io
import traceback
import base64
from PIL import Image
import numpy as np

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # إضافة دعم CORS

# تكوين مجلد للملفات المرفوعة
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/run-python', methods=['POST'])
def run_python():
    data = request.json
    code = data.get('code', '')
    
    if not code:
        return jsonify({'error': 'لم يتم توفير أي كود للتنفيذ'})
    
    # إنشاء ملف مؤقت للكود
    with tempfile.NamedTemporaryFile(suffix='.py', delete=False) as temp_file:
        temp_file_name = temp_file.name
        temp_file.write(code.encode('utf-8'))
    
    try:
        # تنفيذ الكود في عملية منفصلة مع تحديد مهلة زمنية
        process = subprocess.Popen(
            [sys.executable, temp_file_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        
        # انتظار انتهاء العملية مع تحديد مهلة زمنية (5 ثوانٍ)
        stdout, stderr = process.communicate(timeout=5)
        
        # إزالة الملف المؤقت
        os.unlink(temp_file_name)
        
        if stderr:
            # تبسيط رسالة الخطأ
            error_message = simplify_error_message(stderr)
            return jsonify({'error': error_message})
        
        return jsonify({'output': stdout})
    
    except subprocess.TimeoutExpired:
        process.kill()
        os.unlink(temp_file_name)
        return jsonify({'error': 'استغرق تنفيذ الكود وقتًا طويلاً جدًا. تأكد من عدم وجود حلقات لا نهائية.'})
    
    except Exception as e:
        if os.path.exists(temp_file_name):
            os.unlink(temp_file_name)
        return jsonify({'error': str(e)})

@app.route('/upload-file', methods=['POST'])
def upload_file():
    """معالجة رفع الملفات"""
    if 'file' not in request.files:
        return jsonify({'error': 'لم يتم توفير ملف'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'لم يتم اختيار ملف'})
    
    # حفظ الملف في المجلد المؤقت
    filename = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filename)
    
    # إرجاع معلومات الملف
    file_info = {
        'filename': file.filename,
        'path': filename,
        'size': os.path.getsize(filename),
        'type': file.content_type
    }
    
    return jsonify({'success': True, 'file': file_info})

@app.route('/process-image', methods=['POST'])
def process_image():
    """معالجة الصور المرفوعة"""
    data = request.json
    image_data = data.get('image_data', '')
    operation = data.get('operation', 'info')
    
    try:
        # استخراج بيانات الصورة من Base64
        image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        
        # فتح الصورة باستخدام PIL
        img = Image.open(io.BytesIO(image_bytes))
        
        result = {
            'width': img.width,
            'height': img.height,
            'mode': img.mode,
        }
        
        # تنفيذ العملية المطلوبة على الصورة
        if operation == 'grayscale':
            # تحويل الصورة إلى تدرج رمادي
            img = img.convert('L')
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            result['processed_image'] = 'data:image/png;base64,' + base64.b64encode(buffered.getvalue()).decode('utf-8')
            
        elif operation == 'resize':
            # تغيير حجم الصورة
            width = data.get('width', img.width // 2)
            height = data.get('height', img.height // 2)
            img = img.resize((width, height))
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            result['processed_image'] = 'data:image/png;base64,' + base64.b64encode(buffered.getvalue()).decode('utf-8')
            
        elif operation == 'rotate':
            # تدوير الصورة
            angle = data.get('angle', 90)
            img = img.rotate(angle)
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            result['processed_image'] = 'data:image/png;base64,' + base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return jsonify({'success': True, 'result': result})
        
    except Exception as e:
        return jsonify({'error': str(e)})

def simplify_error_message(error_msg):
    """تبسيط رسائل الخطأ وترجمتها للعربية"""
    if 'SyntaxError' in error_msg:
        return 'خطأ في بناء الجملة: تأكد من كتابة الكود بشكل صحيح'
    elif 'NameError' in error_msg:
        return 'خطأ في اسم المتغير: تأكد من تعريف جميع المتغيرات قبل استخدامها'
    elif 'ImportError' in error_msg or 'ModuleNotFoundError' in error_msg:
        return 'خطأ في استيراد المكتبة: تأكد من اسم المكتبة وتثبيتها'
    elif 'IndexError' in error_msg:
        return 'خطأ في الفهرس: حاولت الوصول إلى عنصر غير موجود في القائمة أو المصفوفة'
    elif 'TypeError' in error_msg:
        return 'خطأ في نوع البيانات: تأكد من استخدام الأنواع المناسبة للعمليات'
    elif 'ValueError' in error_msg:
        return 'خطأ في القيمة: القيمة المستخدمة غير صالحة للعملية'
    elif 'ZeroDivisionError' in error_msg:
        return 'خطأ في القسمة: لا يمكن القسمة على صفر'
    else:
        return error_msg


if __name__ == '__main__':
   # الحصول على رقم المنفذ من متغير البيئة أو استخدام المنفذ الافتراضي 10000
     port = int(os.environ.get('PORT', 10000))
     
     # تشغيل التطبيق على العنوان 0.0.0.0 للسماح بالوصول من أي عنوان IP
     app.run(host='0.0.0.0', port=port, debug=True)
