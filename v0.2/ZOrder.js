const ZORDER = (() => { 
    const scriptName = 'ZOrder';
    const version = '0.2';
    const checkInstall = () =>  {
        log(`${scriptName} v${version} initialized`);
    };
    
    const isNumber = function isNumber(value) {
        return typeof value === 'number' && isFinite(value);
    }
    
    const getGPTObject = function(id) {
        let obj = getObj('graphic', id);
        if (obj) return obj;
        
        obj = getObj('path', id);
        if (obj) return obj;
        
        obj = getObj('text', id);
        if (obj) return obj;
    }
    
    const changeOrder = function(selected, delta) {
        let tempObj = getObj(selected._type, selected._id);
        let pageID = tempObj.get('_pageid');
        let page = getObj('page', pageID);
        let currentOrder = page.get('_zorder').split(',');
        
        let moving = false;
        let skipIndex = -999;
        if (delta < 0) {
            //Send Backward  (loops thru currentOrder array in reverse)
            for (let i = currentOrder.length-1; i >= 0 ; i--) {
                if (selected._id === currentOrder[i]) {
                    moving = true;
                    skipIndex = i - 1;
                }
                if (moving && i !== skipIndex) {
                    let obj = getGPTObject(currentOrder[i])
                    if (obj) {
                        toBack(obj);
                    }
                }
            }
        } else {
            //Send Forward   (loops thru currentOrder array normally)
            for (let i = 0; i<currentOrder.length; i++) {
                if (selected._id === currentOrder[i]) {
                    moving = true;
                    skipIndex = i + 1;
                }
                if (moving && i !== skipIndex) {
                    let obj = getGPTObject(currentOrder[i])
                    if (obj) {
                        toFront(obj);
                    }
                }
            }
        }
    }
    
    const handleInput = (msg) => {
        if (msg.type=="api" && msg.content.toLowerCase().indexOf("!zorder")==0) {
            if (msg.selected.length === 0) {
                return;
            }
            
            let selected = msg.selected[0];
            
            let args = msg.content.split(/\s+/);
            
            if (args.length > 1) {
                let delta = parseInt(args[1]);
                if (isNumber(delta)) {
                    //move 1 space in the order
                    if (delta < 0) {
                        //Send Backward
                        changeOrder(selected, -1);
                    } else {
                        //Send Forward
                        changeOrder(selected, 1);
                    }
                } else {
                    //perform full toFront or toBack
                    let obj = getGPTObject(selected._id);
                    if (args[1].toLowerCase().includes('back')) {
                        toBack(obj);
                    } else if (args[1].toLowerCase().includes('front')) {
                        toFront(obj);
                    }
                }
            }
        }
    };
    const registerEventHandlers = () => {
        on('chat:message', handleInput);
    };
    on('ready', () => {
        checkInstall();
        registerEventHandlers();
    });
})();
