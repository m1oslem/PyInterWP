from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # تأكد من تثبيت هذه المكتبة: pip install flask-cors
import subprocess
import tempfile
import os
import sys
import io
import traceback

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # إضافة دعم CORS

# ... باقي الكود كما هو
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
