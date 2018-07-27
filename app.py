from flask import Flask, render_template, jsonify, redirect
from flask_restful import Resource, Api

from sqlalchemy import Column, Float, Integer, String, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session


from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn import datasets, linear_model
from sklearn.metrics import mean_squared_error, r2_score

import numpy as np

import json

Base = declarative_base()

class myJson(Base):
    __tablename__ = "myjson"
    jsonid = Column(Integer, primary_key=True)
    json = Column(Text)

engine = create_engine("sqlite:///myjson.sqlite")
Base.metadata.create_all(engine)

session = Session(bind=engine)


engine_hist = create_engine("sqlite:///histJobDB.sqlite")
Base_hist = automap_base()
Base_hist.prepare(engine_hist, reflect=True)
jobsDB = Base_hist.classes.jobsDB
session_hist = Session(engine_hist)

app = Flask(__name__)
api = Api(app)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/contact')
def contact():
    return render_template("contact.html")

@app.route('/us-states')
def us_states():
    data = session.query(myJson.json).filter(myJson.jsonid==2).all()
    return jsonify(json.loads(data[0][0]))

@app.route('/usa-jobs')
def usa_jobs():
    data = session.query(myJson.json).filter(myJson.jsonid==1).all()
    return jsonify(json.loads(data[0][0]))


class JobsHistory(Resource):
    def get(self, state, occTitle):
        jobTitle = occTitle.replace('---','/')
        data = session_hist.query(jobsDB.year,jobsDB.tot_emp,jobsDB.state).filter(jobsDB.state==state,jobsDB.occ_title==jobTitle).all()
        jsonitem = [{"year": item[0], "value":item[1]} for item in data]
        class ModelPredictor(object):
            def __init__(self,X,y):
                self.X = X
                self.y = y
                #case 1 linear
                self.r2score = []
                self.models = []
                self.models.append(linear_model.LinearRegression())
                self.models[0].fit(self.X,self.y)
                self.r2score.append(r2_score(self.y,self.models[0].predict(self.X)))
                for i in range(1,5):
                    self.models.append(Pipeline([('poly', PolynomialFeatures(degree=i+1)),('linear', linear_model.LinearRegression(fit_intercept=False))]))
                    self.models[i].fit(self.X, self.y)
                    self.r2score.append(r2_score(self.y,self.models[i].predict(self.X)))
            def get_least_r2_model(self):
                return self.models[self.r2score.index(max(self.r2score))]
            def get_new_data_w_predict(self):
                model = self.get_least_r2_model()
                return np.vstack((self.X,2018)),np.vstack((y,model.predict(2018)))
        X = []
        y = []
        for row in data:
            print(row)
            X.append(row[0])
            y.append(row[1])
        X = np.array(X).reshape(len(X),1)
        y = np.array(y).reshape(len(y),1)
        predModel=ModelPredictor(X,y)
        X_new,y_new = predModel.get_new_data_w_predict() 
        jsonitem = [{"year": int(item[0]), "value":int(item[1])} for item in zip(X_new,y_new)]
        return jsonify(jsonitem)

api.add_resource(JobsHistory,'/jobshistory/<string:state>/<string:occTitle>')

if __name__ == "__main__":
    app.run(debug=True)
