var Su = require('vz.rand').Su,
    
    worker = Su(),
    url = Su(),
    ready = Su(),
		awaiting = Su(),
		tasks = Su(),
		nextTag = Su();

function onMessage(e){
	var task = this.that[tasks][e.data[1]];
	task.cb.call(task.that,e.data[0]);
}

function onReady(e){
	this.that[ready] = true;
	this.onmessage = onMessage;
	
	var args;
	while(args = this.that[awaiting].shift()) this.that.run.apply(this.that,args);
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
			u = URL.createObjectURL(blob),
			w = new Worker(url);
	
	w.onmessage = onReady;
	w.that = this;
	
  this[worker] = w;
  this[url] = u;
  this[ready] = false;
  this[awaiting] = [];
  this[tasks] = {};
  this[nextTag] = 0;
  
}

module.exports = Thread;

Thread.prototype.run = function(data,trans,callback,that){
	if(!this[ready]){
    this[awaiting].push(arguments);
		return;
	}
	
	var tag = this[nextTag]++;
	
	if(typeof trans == 'function'){
		that = callback;
		callback = trans;
		trans = null;
	}
	
	if(trans) this[worker].postMessage([data,tag],trans);
	else this[worker].postMessage([data,tag]);
	
	this[tasks][tag] = {cb: callback,that: that || this};
};

Thread.prototype.destroy = function(){
	this[worker].terminate();
	URL.revokeObjectURL(this[url]);
};

