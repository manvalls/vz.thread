#!/usr/bin/env node

//-------------------------------//
// © 2014 Manuel Valls Fernández //
// manolovalls@gmail.com         //
// Todos los derechos reservados //
// All rights reserved           //
//-------------------------------//

function onMessage(e){
	var task = this.that._tasks[e.data[1]];
	
	task.cb.call(task.that,e.data[0]);
}

function onReady(e){
	this.that._ready = true;
	this.onmessage = onMessage;
	
	var args;
	while(args = this.that._awaiting.shift()) this.that.run.apply(this.that,args);
}

function Thread(setup,handler){
	
	if(!handler){
		handler = setup;
		setup = function(){};
	}
	
	var txt = '',i;
	
	txt += 'var handler = ' + handler + ';';
	
	txt += 'function answer(result,trans){' +
		'if(trans) postMessage([result,this.tag],trans);' +
		'else postMessage([result,this.tag]);' +
	'}' +
	
	'addEventListener("message",function(e){' +
		'handler(e.data[0],answer.bind({tag: e.data[1]}));' +
	'});';
	
	if(setup instanceof Array) for(i = 0;i < setup.length;i++) txt += '(' + setup[i] + ')();'
	else txt += '(' + setup + ')();'
	
	txt += 'postMessage("ready");'
	
	var blob = new Blob([txt],{type: 'text/javascript'}),
			url = URL.createObjectURL(blob),
			worker = new Worker(url);
	
	worker.onmessage = onReady;
	
	Object.defineProperties(worker,{
		that: {value: this}
	});
	
	Object.defineProperties(this,{
		_worker: {value: worker},
		_url: {value: url},
		_ready: {value: false,writable: true},
		_awaiting: {value: []},
		_tasks: {value: {}},
		_nextTag: {value: 0,writable: true}
	});
}

module.exports = Thread;

Thread.prototype.run = function(data,trans,callback,that){
	if(!this._ready){
		this._awaiting.push(arguments);
		return;
	}
	
	var tag = this._nextTag++;
	
	if(typeof trans == 'function'){
		that = callback;
		callback = trans;
		trans = null;
	}
	
	if(trans) this._worker.postMessage([data,tag],trans);
	else this._worker.postMessage([data,tag]);
	
	this._tasks[tag] = {cb: callback,that: that || this};
};

Thread.prototype.destroy = function(){
	this._worker.terminate();
	URL.revokeObjectURL(this._url);
};

