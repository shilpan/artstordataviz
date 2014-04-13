# -*- coding: utf-8 -*-
import os
import requests
import json

# Retrieve Flask, our framework
# request module gives access to incoming request data
from flask import Flask, request, make_response, redirect, render_template, jsonify, session, abort, url_for

# create the Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = "gadgadgfadjkfgh234sks"

def authenticate(username, password):
  payload = {'email': username,
                    'password': password}
  r = requests.post("http://catalog.sharedshelf.artstor.org/account", data=payload)
  return r

# Main Page Route
@app.route("/", methods=["GET","POST"])
def index():
  if request.method == "POST":
    username = request.form.get('username', 'abc')
    password = request.form.get('password', 'xyz')

    session['username'] = request.form['username']
    r = authenticate(username, password)

    response_data = r.json()
    if response_data['success'] == True:
      session['cookie'] = r.cookies['sharedshelf']

      response = make_response(redirect('/projects'))
      response.set_cookie('sharedshelf', value=session['cookie'])
      return response

    return render_template('fail.html')

  else:
    return render_template('auth.html')

@app.route("/logout")
def logout():
  if ('cookie' in session):
    session.pop('cookie', None)
    session.pop('username', None)
    session.pop('projectID', None)

  return redirect(url_for('index'))


# Second Page Route
@app.route("/projects")
def show_projects():
  if ('cookie' in session):
    r = requests.get("http://catalog.sharedshelf.artstor.org/projects", cookies={'sharedshelf' : session['cookie']})
    return render_template('list.html', projects=r.json()["items"])
  else:
    return render_template('auth.html')

@app.route("/getdata")
def show_project_data():
  if ('cookie' in session):
    payload = {'start': request.args['from'],
                      'limit': int(request.args['to']) - int(request.args['from']),
                      'dir': 'DESC',
                      'with_meta': 'true',
                     }
    r = requests.get("http://catalog.sharedshelf.artstor.org/projects/" + session['projectID'] +"/assets", params=payload, cookies={'sharedshelf' : session['cookie']})
    return jsonify(r.json())
  else:
    return jsonify({'error': 'not logged in'})

@app.route("/slider/<id>")
def select_project_data(id):
  if ('cookie' in session):
    session['projectID'] = id
    return render_template('slider.html')
  else:
    return render_template('auth.html')

@app.route("/visualize")
def send_project_data():
  if ('cookie' in session):
    session['from'] = request.args['from']
    session['to'] = request.args['to']
    return render_template('dataviz.html',  id = id)
  else:
    return render_template('auth.html')

@app.route("/bounds")
def send_project_bounds():
  if 'from' not in session:
    abort(404)
  tst = {}
  tst['from'] = int(session['from'])
  tst['to'] = int(session['to'])
  return jsonify(tst)

# start the webserver
if __name__ == "__main__":
  app.debug = True

  port = int(os.environ.get('PORT', 4000))
  app.run(host='0.0.0.0', port=port)