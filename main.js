var Property = require('vz.property'),
    
    worker = new Property(),
    url = new Property(),
    ready = new Property(),
		awaiting = new Property(),
		tasks = new Property(),
		nextTag = new Property();

function onMessage(e){
	var task = tasks.of(this.that).get()[e.data[1]];
	task.cb.call(task.that,e.data[0]);
}

function onReady(e){
	ready.of(this.that).set(true);
	this.onmessage = onMessage;
	
	var args;
	while(args = awaiting.of(this.that).get().shift()) this.that.run.apply(this.that,args);
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
	
  worker.of(this).set(w);
  url.of(this).set(u);
  ready.of(this).set(false);
  awaiting.of(this).set([]);
  tasks.of(this).set({});
  nextTag.of(this).set(0);
  
}

module.exports = Thread;

Thread.prototype.run = function(data,trans,callback,that){
	if(!ready.of(this).get()){
    awaiting.of(this).get().push(arguments);
		return;
	}
	
	var tag = nextTag.of(this).value++;
	
	if(typeof trans == 'function'){
		that = callback;
		callback = trans;
		trans = null;
	}
	
	if(trans) worker.of(this).get().postMessage([data,tag],trans);
	else worker.of(this).get().postMessage([data,tag]);
	
	tasks.of(this).get()[tag] = {cb: callback,that: that || this};
};

Thread.prototype.destroy = function(){
	worker.of(this).get().terminate();
	URL.revokeObjectURL(url.of(this).get());
};

