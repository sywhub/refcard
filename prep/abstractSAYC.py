#!/usr/env/python3
# -*- coding: utf-8 -*-
"""
abstractSAYC.py

This module provides an abstract base class for implementing the SAYC (Standard American Yellow Card) bidding system.
"""
import argparse
import os
import json
import pprint
import ast

class AbstractSAYC:
    def __init__(self, fname='baseSAYC.json'):
        if (os.path.exists(fname) == False):
            raise FileNotFoundError(f"File {fname} does not exist.")
        
        with open(fname, 'r') as file:
            fstr = file.read()
        fstr = fstr.replace('\n', '')
        fstr = fstr[fstr.find('{'):-1]
        self.data = json.loads(fstr)
        self.rules = []
        self.bidQue = []
        return

    def init(self):
        self.AbsObj(name='Open', seq=[])
        #self.initQ()

    def initQ(self):
        self.bidQue = []
        tQ = []
        for x in self.rules[0]['Choices']:
            if (x['Bid'] not in self.bidQue):
                tQ.append(x['Bid'])
        for x in tQ:
            self.bidQue.append([x ,'-'])
        for x in tQ:
            self.bidQue.append([x])

    def AbsObj(self, name='AbstractSAYC', seq=[]):
        rules = [x for x in self.data['BidRules'] if x['BidSeq'] == seq]
        if (len(rules) == 0):
            return

        seqObj = {'Ctx': {'Name': name, 'Seq': seq}, 'Choices': []}
        for x in rules:
            obj = [y for y in seqObj['Choices'] if x['Bid'] == y['Bid']]
            isnew = (len(obj) == 0)
            if isnew:
                obj = {'Bid': x['Bid']}
            else:
                obj = obj[0]
            if 'Criteria' in x:
                if ('Criteria' in obj):
                    obj['Criteria'].append(x['Criteria'])
                else:
                    obj['Criteria'] = [x['Criteria']]
            else:
                obj['Criteria'] = {}
            for k in ['Convention', 'GF', 'Forcing']:
                if k in x:
                    obj[k] = x[k]
            if isnew:
                seqObj['Choices'].append(obj)
            self.addToQueue(x['Bid'], seq)
        self.rules.append(seqObj)
    
    def addToQueue(self, bid, seq):
        toAdd = list(seq)
        toAdd.append(bid)
        toAdd2 = list(toAdd)
        toAdd2.append('-')
        if (toAdd not in self.bidQue):
            self.bidQue.append(toAdd)
        if (toAdd2 not in self.bidQue):
            self.bidQue.append(toAdd2)

    def loopQ(self):
        while (len(self.bidQue) > 0):
            seq = self.bidQue.pop(0)
            qName = self.makeName(seq)
            self.AbsObj(qName, seq)

    def makeName(self, seq):
        str = ''
        for i in seq:
            if (i == '-'):
                str += 'p'
            else:
                str += i
        return str

    def output(self):
        p = pprint.PrettyPrinter(indent=2,width=132)
        p.pprint(self.rules)

if __name__ == "__main__":
    # Example usage
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', '--file', type=str, default='baseSAYC.json')
    args = parser.parse_args()

    sayc = AbstractSAYC(args.file)
    sayc.init()
    sayc.loopQ()
    sayc.output()

