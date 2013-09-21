import os
import requests
import time
import urllib
from flask import Flask, request

app = Flask(__name__)   # create our flask app

def sign_request(base_signature):
    from hashlib import sha1
    import hmac
    import binascii

    key = "'fb23f2f838dd4a009a70ccb7f283f138&"
    raw = base_signature

    hashed = hmac.new(key, raw, sha1)
    return binascii.b2a_base64(hashed.digest())[:-1]

# this is our main page
@app.route("/")
def index():
    curr_time = int(time.mktime(time.gmtime()))
    payload = {'oauth_consumer_key': 'e5631275a75f4efa955a4f2fc2508706',
                      'oauth_nonce': 'abc' + str(curr_time),
                      'oauth_signature_method': 'HMAC-SHA1',
                      'oauth_timestamp':  curr_time,
                      'oauth_version': 1.0,
                      'method': 'POST'}
    signature_text = 'POST&http%3A%2F%2Fplatform.fatsecret.com%2Frest%2Fserver.api&' + urllib.quote(urllib.urlencode(payload, True))
    payload['oauth_signature'] = urllib.quote(sign_request(signature_text))
    r = requests.post("http://platform.fatsecret.com/rest/server.api", data=payload)
    print signature_text
    print r.text

    return "<p>" + r.text+ "</p>"

# start the webserver
if __name__ == "__main__":
    app.debug = True

    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)