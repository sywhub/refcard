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
    def __init__(self, fname='baseSAYC.json', seq=[], name=''):
        if (os.path.exists(fname) == False):
            raise FileNotFoundError(f"File {fname} does not exist.")
        
        with open(fname, 'r') as file:
            fstr = file.read()
        fstr = fstr.replace('\n', '')
        fstr = fstr[fstr.find('{'):-1]
        self.data = json.loads(fstr)
        self.seq = seq
        self.name = name
        self.rules = []
        return

    def AbsObj(self):
        rules = [x for x in self.data['BidRules'] if x['BidSeq'] == self.seq]
        seqObj = {'Ctx': {'Name': self.name, 'Seq': self.seq}, 'Choices': []}
        for x in rules:
            obj = {'Bid': x['Bid']}
            if 'Criteria' in x:
                obj['Criteria'] = x['Criteria']
            else:
                obj['Criteria'] = {}
            seqObj['Choices'].append(obj)
        self.rules.append(seqObj)
    
    def output(self):
        p = pprint.PrettyPrinter(indent=2,width=132)
        p.pprint(self.rules)

if __name__ == "__main__":
    # Example usage
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', '--file', type=str, default='baseSAYC.json')
    parser.add_argument('-q', '--seq', type=str, default='[]')
    parser.add_argument('-n', '--name', type=str, default='SAYC')
    args = parser.parse_args()

    sayc = AbstractSAYC(args.file, ast.literal_eval(args.seq), args.name)
    sayc.AbsObj()
    sayc.output()

