"""
This script runs the Global_Codes_App application using a development server.
"""

from os import environ
from Global_Codes_App import app

if __name__ == '__main__':
    #HOST = environ.get('SERVER_HOST', 'localhost')
    HOST = '0.0.0.0'
    try:
        PORT = int(environ.get('SERVER_PORT', '5555'))
    except ValueError:
        PORT = 5555
    app.run(HOST, PORT, debug=True)
