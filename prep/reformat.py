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

class ReformatRules:
    def __init__(self, fname='baseSAYC.json'):
        if (os.path.exists(fname) == False):
            raise FileNotFoundError(f"File {fname} does not exist.")
        
        with open(fname, 'r') as file:
            fstr = file.read()
        fstr = fstr.replace('\n', '')
        vars = fstr.split('};')
        self.data = []
        for v in vars:
            if (v.find('{') < 0):
                continue
            v = v[v.find('{'):]
            v += '}'
            self.data.append(json.loads(v))
        self.bidQue = []
        return

    def AbsObj(self, seq, d, newRules, name):
        rules = [x for x in d['BidRules'] if x['BidSeq'] == seq]
        if (len(rules) == 0):
            return

        seqObj = {'Ctx': {'Name': name, 'Seq': seq}, 'Bids': []}
        for x in rules:
            obj = [y for y in seqObj['Bids'] if x['Bid'] in y.keys()]
            isnew = (len(obj) == 0)
            if isnew:
                obj = {x['Bid']: []}
            else:
                obj = obj[0]
            if 'Criteria' in x:
                obj[x['Bid']].append({'Criteria': x['Criteria']})
            else:
                obj[x['Bid']].append({'Criteria': []})
            for k in ['Convention', 'GF', 'Forcing']:
                if k in x:
                    obj[x['Bid']][len(obj[x['Bid']])-1][k] = x[k]
            if isnew:
                seqObj['Bids'].append(obj)
            self.addToQueue(x['Bid'], seq)
        newRules.append(seqObj)
    
    def addToQueue(self, bid, seq):
        toAdd = [*seq, bid]
        if (toAdd not in self.bidQue):
            self.bidQue.append(toAdd)

        toAdd = [*toAdd, '-']
        if (toAdd not in self.bidQue):
            self.bidQue.append(toAdd)

    def loopVars(self):
        for v in self.data:
            r = self.loopQ(v)
            self.output(v['System Name'], r)

    def loopQ(self, d):
        r = self.seedQue(d)
        while (len(self.bidQue) > 0):
            seq = self.bidQue.pop(0)
            qName = self.makeName(seq)
            self.AbsObj(seq, d, r, qName)
        return r

    def seedQue(self, d):
        self.rootSet = []
        for x in d['BidRules']:
            if x['BidSeq'] not in self.rootSet and self.noPrecedeccsor(x['BidSeq'], d):
                self.rootSet.append(x['BidSeq'])
        r = []
        for x in self.rootSet:
            self.AbsObj(x, d, r, d['System Name'])
        return r

    def noPrecedeccsor(self, seq, d):
        if (len(seq) == 0):
            return True
        for x in self.bidQue:
            if (x == seq):
                return False
        t = seq[:-1]
        while (len(t) >= 0):
            for y in d['BidRules']:
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

    def output(self, vname, rules):
        for c in [' ', '-', '/', '.']:
            vname = vname.replace(c, '')
        print(f"var {vname} = ", end='')
        p = pprint.PrettyPrinter(indent=2,width=132)
        s = p.pformat(rules)
        s += ';'
        print(s)

if __name__ == "__main__":
    # Example usage
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', '--file', type=str, default='baseSAYC.json')
    args = parser.parse_args()

    newrule = ReformatRules(args.file)
    newrule.loopVars()

