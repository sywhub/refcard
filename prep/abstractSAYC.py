#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
abstractSAYC.py

This module provides an abstract base class for implementing the SAYC (Standard American Yellow Card) bidding system.
"""
import argparse
import os
import json
import pprint

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

    def AbsObj(self, seq, name='AbstractSAYC'):
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
        toAdd = [*seq, bid]
        if (toAdd not in self.bidQue):
            self.bidQue.append(toAdd)

        toAdd = [*toAdd, '-']
        if (toAdd not in self.bidQue):
            self.bidQue.append(toAdd)

    def loopQ(self):
        self.seedQue()
        while (len(self.bidQue) > 0):
            seq = self.bidQue.pop(0)
            qName = self.makeName(seq)
            self.AbsObj(seq, qName)

    def seedQue(self):
        self.rootSet = []
        for x in self.data['BidRules']:
            if x['BidSeq'] not in self.rootSet and self.noPrecedeccsor(x['BidSeq']):
                self.rootSet.append(x['BidSeq'])
        for x in self.rootSet:
            self.AbsObj(x, self.data['System Name'])

    def noPrecedeccsor(self, seq):
        if (len(seq) == 0):
            return True
        for x in self.bidQue:
            if (x == seq):
                return False
        t = seq[:-1]
        while (len(t) >= 0):
            for y in self.data['BidRules']:
                if y['BidSeq'] == t:
                    return False
            if (len(t) == 0):
                break
            t = t[:-1]
        return True

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
    sayc.loopQ()
    sayc.output()

