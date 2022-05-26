const ZORDER = (() => { 
    const scriptName = 'ZOrder';
    const version = '0.3';
    const checkInstall = () =>  {
        log(`${scriptName} v${version} initialized`);
    };
    
    const isNumber = function isNumber(value) {
        return typeof value === 'number' && isFinite(value);
    }
    
    //gets a graphic, path, or text object from id
    const getGPTObject = function(id) {
        let obj = getObj('graphic', id);
        if (obj) return obj;
        
        obj = getObj('path', id);
        if (obj) return obj;
        
        obj = getObj('text', id);
        if (obj) return obj;
    }
    
    //returns a concatenated array of object ids grouped by layer
    const getOrderedIDsByLayer = function(currentOrder) {
        let gmObjs = [];        //topmost layer
        let objectsObjs = [];   
        let mapObjs = [];
        let wallObjs = [];      //bottommost layer
        
        for (let i = 0; i<currentOrder.length; i++) {
            let obj = getGPTObject(currentOrder[i]);
            
            if (obj) {
                let layer = obj.get('layer');
                
                switch (layer) {
                    case 'gmlayer':
                        gmObjs.push(obj.get('_id'));
                        break;
                    case 'objects':
                        objectsObjs.push(obj.get('_id'));
                        break;
                    case 'map':
                        mapObjs.push(obj.get('_id'));
                        break;
                    case 'walls':
                        wallObjs.push(obj.get('_id'));
                        break;
                }
            }
        }
        
        //concatenate the arrays of objects in bottom->top order
        return wallObjs.concat(mapObjs, objectsObjs, gmObjs);
        
    }
    const getCurrentIndexByID = function(orderedObjs, id) {
        let idArray = orderedObjs.map(e => e.id);
        return idArray.indexOf(id);
    }
    
    //since the page zorder property has global scope, we first put all objects into relative order w.r.t. their current layer
    //then update this ordered array with new positions and perform a series of toBacks to implement the new order
    const changeOrder = function(selected, delta) {
        let selObj = getObj(selected._type, selected._id);
        let pageID = selObj.get('_pageid');
        let page = getObj('page', pageID);
        
        //this zorder does not respect actual layer stack (i.e. objects layer is above map layer, etc.)
        let currentOrder = page.get('_zorder').split(',');
        
        //put the obj ids in relative order but grouped by their layer
        let orderedIDsByLayer = getOrderedIDsByLayer(currentOrder)
        
        //move the position within the ordered array of IDs
        let oldIndex = orderedIDsByLayer.findIndex(e => e===selected._id);
        let newIndex = oldIndex + delta;
        if (newIndex < 0) { newIndex = 0 }
        if (newIndex > orderedIDsByLayer.length-1) { newIndex = orderedIDsByLayer.length-1 }
        // remove obj from array and store it
        let f = orderedIDsByLayer.splice(oldIndex, 1)[0];
        // insert stored obj into new position`
        orderedIDsByLayer.splice(newIndex, 0, f);
        
        //loop thru orderedIDs in reverse, sending objects toBack to implement the new zorder
        let startIndex = Math.max(oldIndex, newIndex);
        for (let i=startIndex; i>=0; i--) {
            let obj = getGPTObject(orderedIDsByLayer[i])
            toBack(obj);
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
                    changeOrder(selected, delta);
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
