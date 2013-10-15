# -*- coding: utf-8 -*-
import os
import requests
import json

# Retrieve Flask, our framework
# request module gives access to incoming request data
from flask import Flask, request, make_response, redirect, render_template

# API for getting assets for projects
@app.route("/projects")
