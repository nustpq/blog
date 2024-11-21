# iM505B VOS Debugger Tool (readme)
*Released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team`<a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a>

## Overview

*   This tool is for iM505B hardware and VOS software developing and testing purpose based on FAB02 with iM505B EVM platform.
*   The latest update are released on Fortemedia Sharepoint : [VOS Debugger Tool](https://fortemediainc.sharepoint.com/\:f:/s/live_doc/products/Es-PAok8U21PqvLyUOIDTVABewVWI4Mnd_arzARIQlww4Q?e=vlkvkN "Click here to download")
*   The source code repository is available on Bitbucket : [im505b-vos-debugger-tool](https://bitbucket.org/teamfortemedia/im505b-vos-debugger-tool "Click here to download")
*   The test tool is based on server-client architecture.
    *   Server (*ABServer*) is released and maintained by the Tool Team.
    *   Client (*TestCase*) scripts are written in Lua language.

## Working Directory

*   **./Configuration** : Debug data configration for *VOSDebugger.exe*.
*   **./doc** : Test script API reference document.
*   **./firmware** : FAB02 board MCU firmware bin files.
*   **./Server** : Server for FAB02 board hardware communication.
*   **./Noah** : Lua test script parser and related library.
*   **./Simulator** : Simulation test used DSP SW simulator.
*   **./TestCase** : Testcases examples for release.
*   **./Vector** : Included some test vector wave files.
*   **./WaveViewer** : Realtime waveform displayer tool.

## How To Start

*   All test cases are located in directory `./TestCase/`, in which each subfolder is a testcase and subfolder name is the testcase name
*   Test case to run is defined by the variable `"TEST_CASE_NAME"` in `./TestCase/run_test.lua`
*   A test case manager GUI will appear for test case selection if `"TEST_CASE_NAME = case_selector_gui()"` <img src="https://note.youdao.com/yws/api/personal/file/WEBea528048e1b6baeda606f25d4c2dc724?method=download&shareKey=47abb6aead711be44f08cf1d1298caa3" width="500" />
*   User can also change the test case location by the attribute `"Cfg.USER_TEST_SCRIPT_PATH"` in file `"./Noah/lua/config.lua"` <img src="https://note.youdao.com/yws/api/personal/file/WEB07a429c290975488e0d4da2de4d3d88c?method=download&shareKey=750fbb3cbc8bec0a5bacd5da894f6ef3" width="600" />
*   Execute *Run.bat* will start test script
*   Execute *VOSDebugger.exe* will open Debug data reviewer GUI
*   Test client log file (*Test\_Log.log*) is under test case folder
*   Server log file (*ABServer\_Log.log*) is located in `"C:/Users/*USERNAME*/appdata/Local/ABServer/"`

## User Programming API Reference

*   iM505B DSP and FAB02 platform related hardware basic operation functions are provided in this release tool for user's programming own test cases.
*   User can refer to source code in `"./Noah/lua/"` or the document [API Reference](./doc/api_ref_manual.html "a user programming API manual")

## Note

*   The ABServer terminal windows is hiden by default, show it by setting `"SHOW_VM_CONSOLE = 1"` in file `"./Server/ABServer/LaoMuJiVC.ini"`
*   A left click on test terminal will pause the running script, and press `'Enter'` key can resume test.

