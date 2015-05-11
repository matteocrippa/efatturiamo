var exampleFx = null;
var fxTarget = null;
dbug.enable();
var scroller = null;

$E = document.getElement.bind(document);

var Search = new Class({
	
	Implements: [Events, Options],
	
	options: {
		label: null,
		restrict: null
	},
	
	initialize: function(options){
		this.setOptions(options);
		
		this.search = new google.search.WebSearch();
		if (this.options.label) this.search.setUserDefinedLabel(this.options.label);
		if (this.options.restrict) this.search.setSiteRestriction(this.options.restrict);
		this.search.setNoHtmlGeneration();
		this.search.setSearchCompleteCallback(this, this.complete);
	},
	
	complete: function(){
		this.fireEvent('onComplete', [this.search.results]);
	},
	
	query: function(value){
		this.search.execute(value);
		return this;
	}
	
});

Search.Results = new Class({
	
	toElement: function(){
		return this.container;
	},
	
	initialize: function(){
		this.container = new Element('ul', {'class': 'results'});
	},
	
	fill: function(results){
		this.container.empty();
		
		for (var i = 0, l = results.length; i < l; i++){
			
			var li = this.parseResult(results[i]);
			
			this.container.adopt(li);
			
			if (i == results.length - 1) li.addClass('last');
		}
		
		if (results.length == 0){
			var empty = new Element('li', {'class': 'result-item first last'});
			var content = new Element('div', {'class': 'result-content', html: 'no results'});
			empty.adopt(content);
			this.container.adopt(empty);
		}
	},
	
	parseResult: function(result){
		var li = new Element('li', {'class': 'result-item'});
		var title = new Element('a', {'class': 'result-title', html: result.title, href: unescape(result.url)});
		var content = new Element('div', {'class': 'result-content', html: result.content});
		li.adopt(title, content);
		return li;
	}
	
});

Search.Input = new Class({
	
	Implements: [Events, Options],
	
	options: {
		results: 4,
		placeHolder: null,
		id: null,
		className: null
	},
	
	toElement: function(){
		return this.input;
	},
	
	initialize: function(options){
		this.setOptions(options);
		this.input = new Element('input', {type: Browser.Engine.webkit ? 'search' : 'text'});
		if (Browser.Engine.webkit) this.input.set('results', this.options.results);
		if (this.options.id) this.input.set('id', this.options.id);
		var placeHolder = this.options.placeHolder;
		if (placeHolder){
			if (Browser.Engine.webkit){
				this.input.set('placeholder', placeHolder);
			} else {
				this.input.addEvents({
					focus: function(){
						if (this.value == placeHolder) this.value = '';
						this.removeClass('place-holder');
					},
					blur: function(){
						if (!this.value.length){
							this.value = placeHolder;
							this.addClass('place-holder');
						}
					}
				});
				this.input.fireEvent('blur');
			}
		}
		
		this.input.addEvent('keydown', function(event){
			this.value = this.input.value;
			if (event.key == 'enter' && this.value.length) this.fireEvent('onSubmit');
		}.bind(this));
	}
	
});

Search.Results.implement({
	parseResult: function(result){
		var t = escape(result.title);
		t = t.split("%BB")[0].split("%7B")[0].trim();
		//result.title = unescape(t);
		var li = new Element('li', {'class': 'result-item'});
		var title = new Element('a', {'class': 'result-title', html: result.title, href: result.unescapedUrl});
		var content = new Element('div', {'class': 'result-content', html: result.content});
		li.adopt(title, content);
		return li;
	}
});

//returns a collection given an id or a selector
$G = function(elements) {
	return $splat($(elements)||$$(elements))
};

window.addEvent('domready', function() {
	setCNETAssetBaseHref("/cnet.gf/assets");
	try {
		if($('fxTarget')) {
			fxTargetClone = $('fxTarget').clone();
			fxTargetClone.set('id', 'fxTargetClone');
		}
	} catch(e) {dbug.log(e)}

	//dbug.time("links");
	$$('a').each(function(lnk) {
		if(lnk.href.test("c18") || lnk.href.test("cnet.cnwk")){
			var href = lnk.get('href');
			lnk.addEvent('click', function() {
				if(confirm('this link will only work for employees of cnet.com that are within the cnet firewall, click "OK" to continue'))
					window.location.href = href;
			});
			lnk.href = "javascript: void(0);";
		}
	});
	if($('emailSubscribe')){
		$('emailSubscribe').addEvent('focus', function() {
			if($('emailSubscribe').value=='your email') this.value='';
			this.setStyle('color', '#000');
		}).addEvent('blur', function(){
			this.setStyle('color', '#999');
		});	
	}
	
	//dbug.time("accordions");
		scroller = new Fx.Scroll(document.body, {
			transition: Fx.Transitions.backOut
		});
		makeAccordions();
	//dbug.timeEnd("accordions");

	//dbug.time("tabs");
		try {
			if($('tabSet')) {
				var myTabs = new TabSwapper({
					selectedClass: 'on',
					deselectedClass: 'off',
					tabs: '#tabSet li',
					clickers: '#tabSet li a',
					sections: '#panelSet div.panel',
					cookieName: 'testingTabs',
					smooth: true
				});
			}
		} catch(e){
			dbug.log(e);
		}
	//dbug.timeEnd("tabs");

	//dbug.time("code");
	$$('div.code').each(function(el, idx){
		el.setStyle('max-height', '300px');
		el.addEvent('mouseover', function() {
			this.makeResizable({
				handle: this.getElement('img.resizeMe')
			});
		});
		
		try {
			if(el.hasClass("exec")){
				el.getElement('img.executeCodeImg').addEvent('click',function(){
					try {
						var source = el.getElement('.rawScript').innerHTML.replaceAll('<br/>','').replaceAll('<br>','').replaceAll('<p>','').replaceAll('</p>','').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
						dbug.log(source);
						var delayVal = 0;
						if(source.test('fxTarget')) {
							delayVal = grabFXTarget(this); 
						}
						(function(){
							msg = eval(source);
							if(msg) dbug.log(msg);
							else dbug.log('nothing returned');
						}).delay(delayVal);
					} catch(e){
						dbug.log('error executing: %s', e);
					}
				});
			}
		} catch(e){dbug.log('error setting up executor: %s', e);}
	});
	//dbug.timeEnd("code");


		try {	
			$('fxTarget').makeDraggable();
			$('fxTarget').makeDraggable();
		} catch(e){
		}
});

function grabFXTarget(positionToElement){
	try {
	var thisChain = new Chain();
	var thisTarget = fxTargetClone.clone();
			thisTarget.setStyles({
				'top':($('fxTarget').getCoordinates().top>0)?$('fxTarget').getCoordinates().top:200,
				'visibility':'visible'
			});
	var returnval = 70;
	try {
		if($('fxTarget').getStyle('display')=='none' || ($('fxTarget').getCoordinates().top < window.getScroll().y
				 || ($('fxTarget').getCoordinates().top+$('fxTarget').getSize().y) > (window.getScroll().y+window.getSize().y))) {
				returnval = 1500;
		}
	} catch(e){returnval = 1500}
	
	if(returnval > 70) {
		(function(){
			thisTarget.setStyles({
				'top':$('fxTarget').offsetTop,
				'left': $('fxTarget').offsetLeft
			});
			if ($('fxTarget').getStyle('visibility') != 'hidden') {
				thisTarget.replaces($('fxTarget'));
				thisTarget.set('id','fxTarget');
				thisTarget.makeDraggable();
			}
		 }).delay(100);
		(function(){$('fxTarget').setStyle('visibility','visible')}).delay(210);
		(function(){
			var winBottom = window.getScroll().y+window.getSize().y;
			var fxBottom = $('fxTarget').offsetTop+($('fxTarget').getSize().y);
			var scrollFrom = window.getScroll().y-200;
			if (fxBottom > winBottom) scrollFrom = winBottom + 200;
			$('fxTarget').set('morph',{duration: 600, transition: 'back:out'})
			var scrollTo = positionToElement.offsetTop-30;
			if (scrollTo < window.getScroll().y) scrollTo = window.getScroll().y +30;
			$('fxTarget').morph({'top':[scrollFrom,scrollTo]});
		}).delay(270);
	} else {
		//dbug.log('else, :', $('fxTarget').offsetTop);
			thisTarget.setStyles({
				'display':'block',
				'visiblity':'visible',
				'top':$('fxTarget').offsetTop,
				'left':$('fxTarget').offsetLeft
			});
		thisTarget.replaces($('fxTarget')).set('id', 'fxTarget');
	}
	}catch(e){dbug.log(e)}
	return returnval;
};

function makeAccordions(debug){
	if(document.body.innerHTML.test('class="Accordion') || document.body.innerHTML.test('class=Accordion')) {
		$$('dl.Accordion').each(function(panel){
			var minHeight = 0;
			//dbug.time('stretcher measure');
			panel.getElements('dd.stretcher').each(function(stretcher){
				if (minHeight < stretcher.scrollHeight) minHeight = stretcher.scrollHeight;
			});
			panel.setStyle('height', minHeight+200+'px');
			//dbug.timeEnd('stretcher measure');

			new Accordion(panel.getElements('dt.stretchtoggle'), panel.getElements('dd.stretcher'), {
				onActive: function(){
					(function(){
						if(this.previousClick > 0) {
							var top = $(this.elements[this.previousClick]).getPosition().y-50;
							scroller.scrollTo(0, top);
						}
					}).bind(this).delay(500);
				}
			});	
		});
	}
}