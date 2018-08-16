"""
The flask application package.
"""

from flask import Flask
# from flask.ext.stormpath import StormpathManager

app = Flask(__name__)
# app.config['SECRET_KEY'] = 'kdjfkdkjiic1233nk'
# app.config['STORMPATH_API_KEY_FILE'] = r'C:\Scripts\Stormpath\apiKey-3LFWIF8JKNVK34JVSI7EJJUVE.properties'
# app.config['STORMPATH_APPLICATION'] = 'GlobalCodesApp'
# app.config['STORMPATH_ENABLE_MIDDLE_NAME'] = False
# stormpath_manager = StormpathManager(app)


import Global_Codes_App.views
