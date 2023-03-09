import fs from 'fs';
import request from 'request';
import { exit } from 'process';

console.log ("test file " + process.env.testfile);
let checks = await import ("./test-2210.js");

const FgRed = "\x1b[31m";
const Reset = "\x1b[0m";
const FgGreen = "\x1b[32m";

function performTest (unitTest) {
    request.post({
        url: unitTest.url,
        body: JSON.parse(fs.readFileSync(unitTest.testfile)),
        json: true
    }, function(error, response, body){
            if( unitTest.testResult(body)) {
                console.log (FgGreen + " OK " + Reset + " " + unitTest.name );
            } else {
                console.log (FgRed + " KO " + Reset + " " + unitTest.name );
                console.log (error);
                console.log(body);
                //process.exit(1);
            } 
    })
}

function performTestGET (unitTest) {
    request.get({
        url: unitTest.url  ,
        body: JSON.parse(fs.readFileSync(unitTest.testfile ) ),
        json: true
    }, function(error, response, body){
            if( unitTest.testResult(body)) {
                console.log (FgGreen + " OK " + Reset + " " + unitTest.name );
                console.log (body);

            } else {
                console.log (FgRed + " KO " + Reset + " " + unitTest.name );
                console.log (body);
                console.log (error);
                process.exit(1);
            } 
    })
}

checks.default.forEach (uTest => { uTest.type=="post"?performTest ( uTest ):performTestGET ( uTest )  }  )