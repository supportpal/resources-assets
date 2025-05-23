(function(){'use strict';/*
     * DOMParser HTML extension
     * 2012-09-04
     *
     * By Eli Grey, http://eligrey.com
     * Public domain.
     * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
     */ /*! @source https://gist.github.com/1129031 */function DOMParser(){var proto=DOMParser.prototype,nativeParse=proto.parseFromString;// Firefox/Opera/IE throw errors on unsupported types
try{// WebKit returns null on unsupported types
if(new DOMParser().parseFromString("","text/html")){// text/html parsing is natively supported
return;}}catch(ex){}proto.parseFromString=function(markup,type){if(/^\s*text\/html\s*(?:;|$)/i.test(type)){var doc=document.implementation.createHTMLDocument("");if(markup.toLowerCase().indexOf('<!doctype')>-1){doc.documentElement.innerHTML=markup;}else{doc.body.innerHTML=markup;}return doc;}else{return nativeParse.apply(this,arguments);}};}/**
   * Merge fields.
   *
   * @param parameters
   * @constructor
   */function MergeFields(parameters){var instance=this;/**
     * Options.
     */var $container,$toolbar,$preview,$editor,valFn=parameters.valFn;/**
     * List of node attributes that are permitted to contain twig template code.
     */var whitelisted={'img':['src'],'a':['href']};/**
     * HTML used to wrap plugin contents in the DOM.
     *
     * Use $.wrap() with this function.
     *
     * @returns {string}
     * @private
     */var createContainer=function(){return'<div class="sp-editor-container"></div>';};/**
     * Create the textarea toolbar.
     *
     * @returns {string}
     * @private
     */var createToolbar=function(){return''+'<div class="sp-inline-block sp-mt-3">'+'<button class="switch-view visual-preview" type="button">'+Lang.get('general.preview')+'</button>'+'<button class="switch-view code-editor sp-hidden" type="button">'+Lang.get('general.editor')+'</button>'+'</div>';};/**
     * Create the preview HTML.
     *
     * @returns {string}
     * @private
     */var createPreview=function(){return'<div class="sp-editor-preview sp-editor-content"></div>';};/**
     * Check whether the 'html' contains any twig code that exists within HTML nodes or its' attributes.
     *
     * @param html
     * @returns {boolean}
     */var containsTwig=function(html){var parser=new DOMParser(),doc=parser.parseFromString(html,"text/html");var items=doc.getElementsByTagName("*");for(var i=items.length;i--;){// Get the Element.
var node=items[i];// Remove any whitelisted attributes.
if(whitelisted.hasOwnProperty(node.tagName.toLowerCase())){var attributes=whitelisted[node.tagName.toLowerCase()];for(var c=attributes.length;c--;){if(node.hasAttribute(attributes[c])){node.removeAttribute(attributes[c]);}}}// Get the node value (not including any children).
var node_html=node.innerHTML?node.outerHTML.slice(0,node.outerHTML.indexOf(node.innerHTML)):node.outerHTML;// Check if the node contains any twig.
if(/<[^{>]*(\{\{(?:[^}]+|}(?!}))*}}|\{%(?:[^%]+|%(?!}))*%})[^>]*>/gi.test(node_html)){return true;}}return false;};/**
     * Check whether the html contains {{ operator.reply_template }} and show a warning.
     *
     * @param html
     */var containsReplyTemplate=function(html){// Check if the editor contains {{ operator.reply_template }}
if(/\{\{\s*operator\.reply_template(\|raw)?\s*}}/.test(html)){if(!$container.find('.twig-sig-warning').length){$container.append($('<div>',{class:"sp-alert sp-alert-warning sp-mt-3 sp-mb-0 twig-sig-warning",text:Lang.get('core.twig_operator_reply_template')}));}}else{$container.find('.twig-sig-warning').remove();}};/**
     * Changed callback function.
     *
     * @param html
     */this.callback=function(html){// Check if the editor contains {{ operator.reply_template }}.
containsReplyTemplate(html);// Check any twig code exists within HTML nodes or its' attributes.
if(containsTwig(html)){// Add a warning if there isn't one already
if(!$container.find('.twig-html-warning').length){$container.append($('<div>',{class:"sp-alert sp-alert-warning sp-mt-3 sp-mb-0 twig-html-warning",text:Lang.get('core.twig_html_warning')}));}}else{// Remove warning if it exists
$container.find('.twig-html-warning').remove();}};/**
     * Show the visual preview.
     *
     * @return {void}
     */this.showPreview=function(){var errorHandler=function(message){// Change the view back to how it was originally.
$toolbar.find('button:visible').prop('disabled',false).trigger('click');Swal.fire(Lang.get('messages.error'),message||Lang.get('messages.general_error'),'error');};// Determine the height of the editor.
$toolbar.find('button.switch-view').prop('disabled',true);$preview.html('').css($editor.position()).css('width',$editor.outerWidth(true)).css('height',$editor.outerHeight(true)).addClass('loadinggif').show();// If the form has an input called brand_id, use that value else fall back to the
// data-brand set on form-row. If nothing is set then it won't be included.
var brandId=$container.parents('form').find(':input[name="brand_id"]').length?$container.parents('form').find(':input[name="brand_id"]').val():$container.parents('.sp-form-row').data('brand');// Get ticket ID.
var ticketId=$container.parents('form').find(':input[name="ticket_id"]').length?$container.parents('form').find(':input[name="ticket_id"]').val():null;// Attempt to get locale.
var locale=$container.parents('.sp-form-container').find(':input[name$="[language]"]').length?$container.parents('.sp-form-container').find(':input[name$="[language]"]').val():Lang.locale();$.post(laroute.route('core.operator.emailtemplate.preview'),{'template':valFn(),'locale':locale,'template_id':$container.parents('form').data('templateId'),'brand_id':brandId,'ticket_id':ticketId,'is_email':parameters.syntaxEmailTemplate||false?1:0}).done(function(json){if(typeof json.data!=='undefined'){// Inject the HTML (this should be sanitized server-side).
$preview.html(json.data);}else{errorHandler();}}).fail(function(jqXHR,textStatus,errorThrown){try{var json=JSON.parse(jqXHR.responseText);errorHandler(typeof json.message!=='undefined'?json.message:errorThrown);}catch(e){errorHandler(errorThrown);}}).always(function(){$toolbar.find('button.switch-view').prop('disabled',false);$preview.removeClass('loadinggif');});};/**
     * Show the WYSIWYG editor.
     *
     * @return {void}
     */this.showEditor=function(){$preview.hide();};/**
     * Container instance.
     *
     * @returns {*}
     */this.container=function(){return $container;};/**
     * Initialise the container.
     *
     * @param {jQuery} $wrapper
     * @return {void}
     */this.init=function($wrapper){// Add the toolbar after the wrapper.
$editor=$wrapper.after(createContainer());$container=$editor.next('.sp-editor-container');$preview=$(createPreview()).hide();$container.append($preview);$toolbar=$(createToolbar()).on('click','button',function(e){e.preventDefault();if($(this).hasClass('visual-preview')){instance.showPreview();}else{instance.showEditor();}// Switch buttons
$container.find('.switch-view').toggle();});$container.append($toolbar);};}/**
   * Translations.
   *
   * @type {object}
   */MergeFields.translations={merge_fields:Lang.get('operator.merge_fields'),merge_fields_desc:Lang.get('operator.merge_fields_desc')};/**
   * Toolbar icon.
   *
   * @type {string}
   */MergeFields.icon='<svg height="24" width="24"><path d="M 6.098 7.104 C 6.298 8.404 6.498 8.704 6.498 10.004 C 6.498 10.804 4.998 11.504 4.998 11.504 L 4.998 12.504 C 4.998 12.504 6.498 13.204 6.498 14.004 C 6.498 15.304 6.298 15.604 6.098 16.904 C 5.798 19.004 6.898 20.004 7.898 20.004 C 8.898 20.004 9.998 20.004 9.998 20.004 L 9.998 18.004 C 9.998 18.004 8.198 18.204 8.198 17.004 C 8.198 16.104 8.398 16.104 8.598 14.104 C 8.698 13.204 8.098 12.504 7.498 12.004 C 8.098 11.504 8.698 10.904 8.598 10.004 C 8.298 8.004 8.198 8.004 8.198 7.104 C 8.198 5.904 9.998 6.004 9.998 6.004 L 9.998 4.004 C 9.998 4.004 8.998 4.004 7.898 4.004 C 6.798 4.004 5.798 5.004 6.098 7.104 Z"></path><path d="M 17.898 7.104 C 17.698 8.404 17.498 8.704 17.498 10.004 C 17.498 10.804 18.998 11.504 18.998 11.504 L 18.998 12.504 C 18.998 12.504 17.498 13.204 17.498 14.004 C 17.498 15.304 17.698 15.604 17.898 16.904 C 18.198 19.004 17.098 20.004 16.098 20.004 C 15.098 20.004 13.998 20.004 13.998 20.004 L 13.998 18.004 C 13.998 18.004 15.798 18.204 15.798 17.004 C 15.798 16.104 15.598 16.104 15.398 14.104 C 15.298 13.204 15.898 12.504 16.498 12.004 C 15.898 11.504 15.298 10.904 15.398 10.004 C 15.598 8.004 15.798 8.004 15.798 7.104 C 15.798 5.904 13.998 6.004 13.998 6.004 L 13.998 4.004 C 13.998 4.004 14.998 4.004 16.098 4.004 C 17.198 4.004 18.198 5.004 17.898 7.104 Z"></path></svg>';/**
   * Default modal contents.
   *
   * @type {string}
   */MergeFields.modalContent='<section> \
                        <span class="sp-description">'+MergeFields.translations.merge_fields_desc+'</span> \
                        <br /><br /> \
                        <div class="sp-merge-fields sp-flex sp-flex-wrap"> \
                        </div> \
                      </section>';/**
   * Ticket merge fields.
   *
   * @param {bool} show_canned_responses
   * @returns {string}
   */MergeFields.ticketTemplate=function(show_canned_responses){show_canned_responses=show_canned_responses||true;return String()+'<div class="sp-w-full lg:sp-w-1/2">'+'<strong class="sp-text-xl">'+Lang.choice('ticket.ticket',2)+'</strong>'+'<table>'+'<tr>'+'<td><strong>'+Lang.get('operator.strings')+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.id }}">'+Lang.get('general.id')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.number }}">'+Lang.get('general.number')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.token }}">'+Lang.get('core.token')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.subject }}">'+Lang.get('ticket.subject')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ formatDate(ticket.due_time) }}">'+Lang.get('ticket.due_time')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ formatDate(ticket.created_at) }}">'+Lang.get('ticket.created_time')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ formatDate(ticket.updated_at) }}">'+Lang.get('ticket.last_action')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.lastReply.purified_text|raw }}">'+Lang.get('ticket.last_message_text')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.frontend_url }}">'+Lang.get('operator.frontend_url')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.operator_url }}">'+Lang.get('operator.operator_url')+'</button></td>'+'</tr>'+'<tr>'+'<td><strong>'+Lang.choice('ticket.department',1)+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.department.id }}">'+Lang.get('general.id')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.department.frontend_name }}">'+Lang.get('general.name')+'</button></td>'+'</tr>'+'<tr>'+'<td><strong>'+Lang.choice('general.status',1)+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.status.id }}">'+Lang.get('general.id')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.status.name }}">'+Lang.get('general.name')+'</button></td>'+'</tr>'+'<tr>'+'<td><strong>'+Lang.choice('ticket.priority',1)+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.priority.id }}">'+Lang.get('general.id')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.priority.name }}">'+Lang.get('general.name')+'</button></td>'+'</tr>'+'<tr>'+'<td><strong>'+Lang.choice('ticket.sla_plan',1)+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.slaplan.name }}">'+Lang.get('general.name')+'</button></td>'+'</tr>'+'<tr>'+'<td><strong>'+Lang.get('operator.collections')+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{% for tag in ticket.tags %}{{ tag.name }}{% endfor %}">'+Lang.choice('ticket.tag',2)+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{% for user in ticket.assigned %}{{ user.formatted_name }}{% endfor %}">'+Lang.get('ticket.assigned_operator')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{% for field in ticket.customfields %}{{ field.id }}{% endfor %}">'+Lang.choice('customfield.customfield',2)+'</button></td>'+'</tr>'+(!show_canned_responses?'':'<tr>'+'<td><br /></td>'+'</tr>'+'<tr>'+'<td><strong class="sp-text-xl">'+Lang.choice('ticket.cannedresponse',2)+'</strong></td>'+'</tr>'+'<tr>'+'<td><span class="sp-description">'+Lang.get('operator.merge_field_canned_desc')+'</span></td>'+'</tr>')+'</table>'+'</div>';};/**
   * User and system merge fields.
   *
   * @param {bool} show_organisations
   * @returns {string}
   */MergeFields.userAndSystemTemplate=function(show_organisations){return String()+'<div class="sp-w-full sp-mt-6 lg:sp-w-1/2 lg:sp-mt-0">'+'<strong class="sp-text-xl">'+Lang.choice('user.user',2)+'</strong>'+'<table>'+'<tr>'+'<td><strong>'+Lang.get('operator.strings')+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.id }}">'+Lang.get('general.id')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.formatted_name }}">'+Lang.get('user.formatted_name')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.firstname }}">'+Lang.get('user.firstname')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.lastname }}">'+Lang.get('user.lastname')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.email }}">'+Lang.get('general.email')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.email_verified }}">'+Lang.get('user.verified')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.active }}">'+Lang.get('user.account_active')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.country }}">'+Lang.get('user.country')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.language_code }}">'+Lang.choice('general.language',1)+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ formatDate(user.created_at) }}">'+Lang.get('ticket.created_time')+'</button></td>'+'</tr>'+(!show_organisations?'':'<tr>'+'<td><strong>'+Lang.choice('user.organisation',1)+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ user.organisation.name }}">'+Lang.get('general.name')+'</button></td>'+'</tr>')+'<tr>'+'<td><strong>'+Lang.get('operator.collections')+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{% for group in user.groups %}{{ group.name }}{% endfor %}">'+Lang.choice('user.group',2)+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{% for field in ticket.customfields %}{{ field.id }}{% endfor %}">'+Lang.choice('customfield.customfield',2)+'</button></td>'+'</tr>'+'<tr>'+'<td>'+'<br />'+'<strong class="sp-text-xl">'+Lang.choice('core.brand',1)+'</strong>'+'</td>'+'</tr>'+'<tr>'+'<td><strong>'+Lang.get('operator.strings')+'</strong></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ brand.name }}">'+Lang.get('core.brand_name')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ brand.default_email }}">'+Lang.get('general.email_address')+'</button></td>'+'</tr>'+'<tr>'+'<td><button type="button" class="sp-button-sm" data-mf="{{ brand.frontend_url }}">'+Lang.get('operator.frontend_url')+'</button></td>'+'</tr>'+'</table>'+'</div>';};/**
   * Append merge fields to the modal.
   *
   * @param $modal
   * @param {bool} show_tickets
   * @param {bool} show_canned_responses
   * @param {bool} show_organisations
   * @returns {jQuery}
   */MergeFields.appendTo=function($modal,show_tickets,show_canned_responses,show_organisations){return $modal.find('.sp-merge-fields').append(show_tickets?MergeFields.ticketTemplate(show_canned_responses):'').append(MergeFields.userAndSystemTemplate(show_organisations)).find('button').on('click',function(){$(this).trigger('mergefield:inserted',{value:$(this).data('mf')});});};/**
  The data structure for documents. @nonabstract
  */class Text{/**
      Get the line description around the given position.
      */lineAt(pos){if(pos<0||pos>this.length)throw new RangeError(`Invalid position ${pos} in document of length ${this.length}`);return this.lineInner(pos,false,1,0);}/**
      Get the description for the given (1-based) line number.
      */line(n){if(n<1||n>this.lines)throw new RangeError(`Invalid line number ${n} in ${this.lines}-line document`);return this.lineInner(n,true,1,0);}/**
      Replace a range of the text with the given content.
      */replace(from,to,text){[from,to]=clip(this,from,to);let parts=[];this.decompose(0,from,parts,2/* Open.To */);if(text.length)text.decompose(0,text.length,parts,1/* Open.From */|2/* Open.To */);this.decompose(to,this.length,parts,1/* Open.From */);return TextNode.from(parts,this.length-(to-from)+text.length);}/**
      Append another document to this one.
      */append(other){return this.replace(this.length,this.length,other);}/**
      Retrieve the text between the given points.
      */slice(from,to=this.length){[from,to]=clip(this,from,to);let parts=[];this.decompose(from,to,parts,0);return TextNode.from(parts,to-from);}/**
      Test whether this text is equal to another instance.
      */eq(other){if(other==this)return true;if(other.length!=this.length||other.lines!=this.lines)return false;let start=this.scanIdentical(other,1),end=this.length-this.scanIdentical(other,-1);let a=new RawTextCursor(this),b=new RawTextCursor(other);for(let skip=start,pos=start;;){a.next(skip);b.next(skip);skip=0;if(a.lineBreak!=b.lineBreak||a.done!=b.done||a.value!=b.value)return false;pos+=a.value.length;if(a.done||pos>=end)return true;}}/**
      Iterate over the text. When `dir` is `-1`, iteration happens
      from end to start. This will return lines and the breaks between
      them as separate strings.
      */iter(dir=1){return new RawTextCursor(this,dir);}/**
      Iterate over a range of the text. When `from` > `to`, the
      iterator will run in reverse.
      */iterRange(from,to=this.length){return new PartialTextCursor(this,from,to);}/**
      Return a cursor that iterates over the given range of lines,
      _without_ returning the line breaks between, and yielding empty
      strings for empty lines.
      
      When `from` and `to` are given, they should be 1-based line numbers.
      */iterLines(from,to){let inner;if(from==null){inner=this.iter();}else{if(to==null)to=this.lines+1;let start=this.line(from).from;inner=this.iterRange(start,Math.max(start,to==this.lines+1?this.length:to<=1?0:this.line(to-1).to));}return new LineCursor(inner);}/**
      Return the document as a string, using newline characters to
      separate lines.
      */toString(){return this.sliceString(0);}/**
      Convert the document to an array of lines (which can be
      deserialized again via [`Text.of`](https://codemirror.net/6/docs/ref/#state.Text^of)).
      */toJSON(){let lines=[];this.flatten(lines);return lines;}/**
      @internal
      */constructor(){}/**
      Create a `Text` instance for the given array of lines.
      */static of(text){if(text.length==0)throw new RangeError("A document must have at least one line");if(text.length==1&&!text[0])return Text.empty;return text.length<=32/* Tree.Branch */?new TextLeaf(text):TextNode.from(TextLeaf.split(text,[]));}}// Leaves store an array of line strings. There are always line breaks
// between these strings. Leaves are limited in size and have to be
// contained in TextNode instances for bigger documents.
class TextLeaf extends Text{constructor(text,length=textLength(text)){super();this.text=text;this.length=length;}get lines(){return this.text.length;}get children(){return null;}lineInner(target,isLine,line,offset){for(let i=0;;i++){let string=this.text[i],end=offset+string.length;if((isLine?line:end)>=target)return new Line(offset,end,line,string);offset=end+1;line++;}}decompose(from,to,target,open){let text=from<=0&&to>=this.length?this:new TextLeaf(sliceText(this.text,from,to),Math.min(to,this.length)-Math.max(0,from));if(open&1/* Open.From */){let prev=target.pop();let joined=appendText(text.text,prev.text.slice(),0,text.length);if(joined.length<=32/* Tree.Branch */){target.push(new TextLeaf(joined,prev.length+text.length));}else{let mid=joined.length>>1;target.push(new TextLeaf(joined.slice(0,mid)),new TextLeaf(joined.slice(mid)));}}else{target.push(text);}}replace(from,to,text){if(!(text instanceof TextLeaf))return super.replace(from,to,text);[from,to]=clip(this,from,to);let lines=appendText(this.text,appendText(text.text,sliceText(this.text,0,from)),to);let newLen=this.length+text.length-(to-from);if(lines.length<=32/* Tree.Branch */)return new TextLeaf(lines,newLen);return TextNode.from(TextLeaf.split(lines,[]),newLen);}sliceString(from,to=this.length,lineSep="\n"){[from,to]=clip(this,from,to);let result="";for(let pos=0,i=0;pos<=to&&i<this.text.length;i++){let line=this.text[i],end=pos+line.length;if(pos>from&&i)result+=lineSep;if(from<end&&to>pos)result+=line.slice(Math.max(0,from-pos),to-pos);pos=end+1;}return result;}flatten(target){for(let line of this.text)target.push(line);}scanIdentical(){return 0;}static split(text,target){let part=[],len=-1;for(let line of text){part.push(line);len+=line.length+1;if(part.length==32/* Tree.Branch */){target.push(new TextLeaf(part,len));part=[];len=-1;}}if(len>-1)target.push(new TextLeaf(part,len));return target;}}// Nodes provide the tree structure of the `Text` type. They store a
// number of other nodes or leaves, taking care to balance themselves
// on changes. There are implied line breaks _between_ the children of
// a node (but not before the first or after the last child).
class TextNode extends Text{constructor(children,length){super();this.children=children;this.length=length;this.lines=0;for(let child of children)this.lines+=child.lines;}lineInner(target,isLine,line,offset){for(let i=0;;i++){let child=this.children[i],end=offset+child.length,endLine=line+child.lines-1;if((isLine?endLine:end)>=target)return child.lineInner(target,isLine,line,offset);offset=end+1;line=endLine+1;}}decompose(from,to,target,open){for(let i=0,pos=0;pos<=to&&i<this.children.length;i++){let child=this.children[i],end=pos+child.length;if(from<=end&&to>=pos){let childOpen=open&((pos<=from?1/* Open.From */:0)|(end>=to?2/* Open.To */:0));if(pos>=from&&end<=to&&!childOpen)target.push(child);else child.decompose(from-pos,to-pos,target,childOpen);}pos=end+1;}}replace(from,to,text){[from,to]=clip(this,from,to);if(text.lines<this.lines)for(let i=0,pos=0;i<this.children.length;i++){let child=this.children[i],end=pos+child.length;// Fast path: if the change only affects one child and the
// child's size remains in the acceptable range, only update
// that child
if(from>=pos&&to<=end){let updated=child.replace(from-pos,to-pos,text);let totalLines=this.lines-child.lines+updated.lines;if(updated.lines<totalLines>>5/* Tree.BranchShift */-1&&updated.lines>totalLines>>5/* Tree.BranchShift */+1){let copy=this.children.slice();copy[i]=updated;return new TextNode(copy,this.length-(to-from)+text.length);}return super.replace(pos,end,updated);}pos=end+1;}return super.replace(from,to,text);}sliceString(from,to=this.length,lineSep="\n"){[from,to]=clip(this,from,to);let result="";for(let i=0,pos=0;i<this.children.length&&pos<=to;i++){let child=this.children[i],end=pos+child.length;if(pos>from&&i)result+=lineSep;if(from<end&&to>pos)result+=child.sliceString(from-pos,to-pos,lineSep);pos=end+1;}return result;}flatten(target){for(let child of this.children)child.flatten(target);}scanIdentical(other,dir){if(!(other instanceof TextNode))return 0;let length=0;let[iA,iB,eA,eB]=dir>0?[0,0,this.children.length,other.children.length]:[this.children.length-1,other.children.length-1,-1,-1];for(;;iA+=dir,iB+=dir){if(iA==eA||iB==eB)return length;let chA=this.children[iA],chB=other.children[iB];if(chA!=chB)return length+chA.scanIdentical(chB,dir);length+=chA.length+1;}}static from(children,length=children.reduce((l,ch)=>l+ch.length+1,-1)){let lines=0;for(let ch of children)lines+=ch.lines;if(lines<32/* Tree.Branch */){let flat=[];for(let ch of children)ch.flatten(flat);return new TextLeaf(flat,length);}let chunk=Math.max(32/* Tree.Branch */,lines>>5/* Tree.BranchShift */),maxChunk=chunk<<1,minChunk=chunk>>1;let chunked=[],currentLines=0,currentLen=-1,currentChunk=[];function add(child){let last;if(child.lines>maxChunk&&child instanceof TextNode){for(let node of child.children)add(node);}else if(child.lines>minChunk&&(currentLines>minChunk||!currentLines)){flush();chunked.push(child);}else if(child instanceof TextLeaf&&currentLines&&(last=currentChunk[currentChunk.length-1])instanceof TextLeaf&&child.lines+last.lines<=32/* Tree.Branch */){currentLines+=child.lines;currentLen+=child.length+1;currentChunk[currentChunk.length-1]=new TextLeaf(last.text.concat(child.text),last.length+1+child.length);}else{if(currentLines+child.lines>chunk)flush();currentLines+=child.lines;currentLen+=child.length+1;currentChunk.push(child);}}function flush(){if(currentLines==0)return;chunked.push(currentChunk.length==1?currentChunk[0]:TextNode.from(currentChunk,currentLen));currentLen=-1;currentLines=currentChunk.length=0;}for(let child of children)add(child);flush();return chunked.length==1?chunked[0]:new TextNode(chunked,length);}}Text.empty=/*@__PURE__*/new TextLeaf([""],0);function textLength(text){let length=-1;for(let line of text)length+=line.length+1;return length;}function appendText(text,target,from=0,to=1e9){for(let pos=0,i=0,first=true;i<text.length&&pos<=to;i++){let line=text[i],end=pos+line.length;if(end>=from){if(end>to)line=line.slice(0,to-pos);if(pos<from)line=line.slice(from-pos);if(first){target[target.length-1]+=line;first=false;}else target.push(line);}pos=end+1;}return target;}function sliceText(text,from,to){return appendText(text,[""],from,to);}class RawTextCursor{constructor(text,dir=1){this.dir=dir;this.done=false;this.lineBreak=false;this.value="";this.nodes=[text];this.offsets=[dir>0?1:(text instanceof TextLeaf?text.text.length:text.children.length)<<1];}nextInner(skip,dir){this.done=this.lineBreak=false;for(;;){let last=this.nodes.length-1;let top=this.nodes[last],offsetValue=this.offsets[last],offset=offsetValue>>1;let size=top instanceof TextLeaf?top.text.length:top.children.length;if(offset==(dir>0?size:0)){if(last==0){this.done=true;this.value="";return this;}if(dir>0)this.offsets[last-1]++;this.nodes.pop();this.offsets.pop();}else if((offsetValue&1)==(dir>0?0:1)){this.offsets[last]+=dir;if(skip==0){this.lineBreak=true;this.value="\n";return this;}skip--;}else if(top instanceof TextLeaf){// Move to the next string
let next=top.text[offset+(dir<0?-1:0)];this.offsets[last]+=dir;if(next.length>Math.max(0,skip)){this.value=skip==0?next:dir>0?next.slice(skip):next.slice(0,next.length-skip);return this;}skip-=next.length;}else{let next=top.children[offset+(dir<0?-1:0)];if(skip>next.length){skip-=next.length;this.offsets[last]+=dir;}else{if(dir<0)this.offsets[last]--;this.nodes.push(next);this.offsets.push(dir>0?1:(next instanceof TextLeaf?next.text.length:next.children.length)<<1);}}}}next(skip=0){if(skip<0){this.nextInner(-skip,-this.dir);skip=this.value.length;}return this.nextInner(skip,this.dir);}}class PartialTextCursor{constructor(text,start,end){this.value="";this.done=false;this.cursor=new RawTextCursor(text,start>end?-1:1);this.pos=start>end?text.length:0;this.from=Math.min(start,end);this.to=Math.max(start,end);}nextInner(skip,dir){if(dir<0?this.pos<=this.from:this.pos>=this.to){this.value="";this.done=true;return this;}skip+=Math.max(0,dir<0?this.pos-this.to:this.from-this.pos);let limit=dir<0?this.pos-this.from:this.to-this.pos;if(skip>limit)skip=limit;limit-=skip;let{value}=this.cursor.next(skip);this.pos+=(value.length+skip)*dir;this.value=value.length<=limit?value:dir<0?value.slice(value.length-limit):value.slice(0,limit);this.done=!this.value;return this;}next(skip=0){if(skip<0)skip=Math.max(skip,this.from-this.pos);else if(skip>0)skip=Math.min(skip,this.to-this.pos);return this.nextInner(skip,this.cursor.dir);}get lineBreak(){return this.cursor.lineBreak&&this.value!="";}}class LineCursor{constructor(inner){this.inner=inner;this.afterBreak=true;this.value="";this.done=false;}next(skip=0){let{done,lineBreak,value}=this.inner.next(skip);if(done&&this.afterBreak){this.value="";this.afterBreak=false;}else if(done){this.done=true;this.value="";}else if(lineBreak){if(this.afterBreak){this.value="";}else{this.afterBreak=true;this.next();}}else{this.value=value;this.afterBreak=false;}return this;}get lineBreak(){return false;}}if(typeof Symbol!="undefined"){Text.prototype[Symbol.iterator]=function(){return this.iter();};RawTextCursor.prototype[Symbol.iterator]=PartialTextCursor.prototype[Symbol.iterator]=LineCursor.prototype[Symbol.iterator]=function(){return this;};}/**
  This type describes a line in the document. It is created
  on-demand when lines are [queried](https://codemirror.net/6/docs/ref/#state.Text.lineAt).
  */class Line{/**
      @internal
      */constructor(/**
      The position of the start of the line.
      */from,/**
      The position at the end of the line (_before_ the line break,
      or at the end of document for the last line).
      */to,/**
      This line's line number (1-based).
      */number,/**
      The line's content.
      */text){this.from=from;this.to=to;this.number=number;this.text=text;}/**
      The length of the line (not including any line break after it).
      */get length(){return this.to-this.from;}}function clip(text,from,to){from=Math.max(0,Math.min(text.length,from));return[from,Math.max(from,Math.min(text.length,to))];}// Compressed representation of the Grapheme_Cluster_Break=Extend
// information from
// http://www.unicode.org/Public/13.0.0/ucd/auxiliary/GraphemeBreakProperty.txt.
// Each pair of elements represents a range, as an offet from the
// previous range and a length. Numbers are in base-36, with the empty
// string being a shorthand for 1.
let extend=/*@__PURE__*/"lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o".split(",").map(s=>s?parseInt(s,36):1);// Convert offsets into absolute values
for(let i=1;i<extend.length;i++)extend[i]+=extend[i-1];function isExtendingChar(code){for(let i=1;i<extend.length;i+=2)if(extend[i]>code)return extend[i-1]<=code;return false;}function isRegionalIndicator(code){return code>=0x1F1E6&&code<=0x1F1FF;}const ZWJ=0x200d;/**
  Returns a next grapheme cluster break _after_ (not equal to)
  `pos`, if `forward` is true, or before otherwise. Returns `pos`
  itself if no further cluster break is available in the string.
  Moves across surrogate pairs, extending characters (when
  `includeExtending` is true), characters joined with zero-width
  joiners, and flag emoji.
  */function findClusterBreak(str,pos,forward=true,includeExtending=true){return(forward?nextClusterBreak:prevClusterBreak)(str,pos,includeExtending);}function nextClusterBreak(str,pos,includeExtending){if(pos==str.length)return pos;// If pos is in the middle of a surrogate pair, move to its start
if(pos&&surrogateLow(str.charCodeAt(pos))&&surrogateHigh(str.charCodeAt(pos-1)))pos--;let prev=codePointAt(str,pos);pos+=codePointSize(prev);while(pos<str.length){let next=codePointAt(str,pos);if(prev==ZWJ||next==ZWJ||includeExtending&&isExtendingChar(next)){pos+=codePointSize(next);prev=next;}else if(isRegionalIndicator(next)){let countBefore=0,i=pos-2;while(i>=0&&isRegionalIndicator(codePointAt(str,i))){countBefore++;i-=2;}if(countBefore%2==0)break;else pos+=2;}else{break;}}return pos;}function prevClusterBreak(str,pos,includeExtending){while(pos>0){let found=nextClusterBreak(str,pos-2,includeExtending);if(found<pos)return found;pos--;}return 0;}function surrogateLow(ch){return ch>=0xDC00&&ch<0xE000;}function surrogateHigh(ch){return ch>=0xD800&&ch<0xDC00;}/**
  Find the code point at the given position in a string (like the
  [`codePointAt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt)
  string method).
  */function codePointAt(str,pos){let code0=str.charCodeAt(pos);if(!surrogateHigh(code0)||pos+1==str.length)return code0;let code1=str.charCodeAt(pos+1);if(!surrogateLow(code1))return code0;return(code0-0xd800<<10)+(code1-0xdc00)+0x10000;}/**
  Given a Unicode codepoint, return the JavaScript string that
  respresents it (like
  [`String.fromCodePoint`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint)).
  */function fromCodePoint(code){if(code<=0xffff)return String.fromCharCode(code);code-=0x10000;return String.fromCharCode((code>>10)+0xd800,(code&1023)+0xdc00);}/**
  The amount of positions a character takes up a JavaScript string.
  */function codePointSize(code){return code<0x10000?1:2;}const DefaultSplit=/\r\n?|\n/;/**
  Distinguishes different ways in which positions can be mapped.
  */var MapMode=/*@__PURE__*/function(MapMode){/**
      Map a position to a valid new position, even when its context
      was deleted.
      */MapMode[MapMode["Simple"]=0]="Simple";/**
      Return null if deletion happens across the position.
      */MapMode[MapMode["TrackDel"]=1]="TrackDel";/**
      Return null if the character _before_ the position is deleted.
      */MapMode[MapMode["TrackBefore"]=2]="TrackBefore";/**
      Return null if the character _after_ the position is deleted.
      */MapMode[MapMode["TrackAfter"]=3]="TrackAfter";return MapMode;}(MapMode||(MapMode={}));/**
  A change description is a variant of [change set](https://codemirror.net/6/docs/ref/#state.ChangeSet)
  that doesn't store the inserted text. As such, it can't be
  applied, but is cheaper to store and manipulate.
  */class ChangeDesc{// Sections are encoded as pairs of integers. The first is the
// length in the current document, and the second is -1 for
// unaffected sections, and the length of the replacement content
// otherwise. So an insertion would be (0, n>0), a deletion (n>0,
// 0), and a replacement two positive numbers.
/**
      @internal
      */constructor(/**
      @internal
      */sections){this.sections=sections;}/**
      The length of the document before the change.
      */get length(){let result=0;for(let i=0;i<this.sections.length;i+=2)result+=this.sections[i];return result;}/**
      The length of the document after the change.
      */get newLength(){let result=0;for(let i=0;i<this.sections.length;i+=2){let ins=this.sections[i+1];result+=ins<0?this.sections[i]:ins;}return result;}/**
      False when there are actual changes in this set.
      */get empty(){return this.sections.length==0||this.sections.length==2&&this.sections[1]<0;}/**
      Iterate over the unchanged parts left by these changes. `posA`
      provides the position of the range in the old document, `posB`
      the new position in the changed document.
      */iterGaps(f){for(let i=0,posA=0,posB=0;i<this.sections.length;){let len=this.sections[i++],ins=this.sections[i++];if(ins<0){f(posA,posB,len);posB+=len;}else{posB+=ins;}posA+=len;}}/**
      Iterate over the ranges changed by these changes. (See
      [`ChangeSet.iterChanges`](https://codemirror.net/6/docs/ref/#state.ChangeSet.iterChanges) for a
      variant that also provides you with the inserted text.)
      `fromA`/`toA` provides the extent of the change in the starting
      document, `fromB`/`toB` the extent of the replacement in the
      changed document.
      
      When `individual` is true, adjacent changes (which are kept
      separate for [position mapping](https://codemirror.net/6/docs/ref/#state.ChangeDesc.mapPos)) are
      reported separately.
      */iterChangedRanges(f,individual=false){iterChanges(this,f,individual);}/**
      Get a description of the inverted form of these changes.
      */get invertedDesc(){let sections=[];for(let i=0;i<this.sections.length;){let len=this.sections[i++],ins=this.sections[i++];if(ins<0)sections.push(len,ins);else sections.push(ins,len);}return new ChangeDesc(sections);}/**
      Compute the combined effect of applying another set of changes
      after this one. The length of the document after this set should
      match the length before `other`.
      */composeDesc(other){return this.empty?other:other.empty?this:composeSets(this,other);}/**
      Map this description, which should start with the same document
      as `other`, over another set of changes, so that it can be
      applied after it. When `before` is true, map as if the changes
      in `other` happened before the ones in `this`.
      */mapDesc(other,before=false){return other.empty?this:mapSet(this,other,before);}mapPos(pos,assoc=-1,mode=MapMode.Simple){let posA=0,posB=0;for(let i=0;i<this.sections.length;){let len=this.sections[i++],ins=this.sections[i++],endA=posA+len;if(ins<0){if(endA>pos)return posB+(pos-posA);posB+=len;}else{if(mode!=MapMode.Simple&&endA>=pos&&(mode==MapMode.TrackDel&&posA<pos&&endA>pos||mode==MapMode.TrackBefore&&posA<pos||mode==MapMode.TrackAfter&&endA>pos))return null;if(endA>pos||endA==pos&&assoc<0&&!len)return pos==posA||assoc<0?posB:posB+ins;posB+=ins;}posA=endA;}if(pos>posA)throw new RangeError(`Position ${pos} is out of range for changeset of length ${posA}`);return posB;}/**
      Check whether these changes touch a given range. When one of the
      changes entirely covers the range, the string `"cover"` is
      returned.
      */touchesRange(from,to=from){for(let i=0,pos=0;i<this.sections.length&&pos<=to;){let len=this.sections[i++],ins=this.sections[i++],end=pos+len;if(ins>=0&&pos<=to&&end>=from)return pos<from&&end>to?"cover":true;pos=end;}return false;}/**
      @internal
      */toString(){let result="";for(let i=0;i<this.sections.length;){let len=this.sections[i++],ins=this.sections[i++];result+=(result?" ":"")+len+(ins>=0?":"+ins:"");}return result;}/**
      Serialize this change desc to a JSON-representable value.
      */toJSON(){return this.sections;}/**
      Create a change desc from its JSON representation (as produced
      by [`toJSON`](https://codemirror.net/6/docs/ref/#state.ChangeDesc.toJSON).
      */static fromJSON(json){if(!Array.isArray(json)||json.length%2||json.some(a=>typeof a!="number"))throw new RangeError("Invalid JSON representation of ChangeDesc");return new ChangeDesc(json);}/**
      @internal
      */static create(sections){return new ChangeDesc(sections);}}/**
  A change set represents a group of modifications to a document. It
  stores the document length, and can only be applied to documents
  with exactly that length.
  */class ChangeSet extends ChangeDesc{constructor(sections,/**
      @internal
      */inserted){super(sections);this.inserted=inserted;}/**
      Apply the changes to a document, returning the modified
      document.
      */apply(doc){if(this.length!=doc.length)throw new RangeError("Applying change set to a document with the wrong length");iterChanges(this,(fromA,toA,fromB,_toB,text)=>doc=doc.replace(fromB,fromB+(toA-fromA),text),false);return doc;}mapDesc(other,before=false){return mapSet(this,other,before,true);}/**
      Given the document as it existed _before_ the changes, return a
      change set that represents the inverse of this set, which could
      be used to go from the document created by the changes back to
      the document as it existed before the changes.
      */invert(doc){let sections=this.sections.slice(),inserted=[];for(let i=0,pos=0;i<sections.length;i+=2){let len=sections[i],ins=sections[i+1];if(ins>=0){sections[i]=ins;sections[i+1]=len;let index=i>>1;while(inserted.length<index)inserted.push(Text.empty);inserted.push(len?doc.slice(pos,pos+len):Text.empty);}pos+=len;}return new ChangeSet(sections,inserted);}/**
      Combine two subsequent change sets into a single set. `other`
      must start in the document produced by `this`. If `this` goes
      `docA` → `docB` and `other` represents `docB` → `docC`, the
      returned value will represent the change `docA` → `docC`.
      */compose(other){return this.empty?other:other.empty?this:composeSets(this,other,true);}/**
      Given another change set starting in the same document, maps this
      change set over the other, producing a new change set that can be
      applied to the document produced by applying `other`. When
      `before` is `true`, order changes as if `this` comes before
      `other`, otherwise (the default) treat `other` as coming first.
      
      Given two changes `A` and `B`, `A.compose(B.map(A))` and
      `B.compose(A.map(B, true))` will produce the same document. This
      provides a basic form of [operational
      transformation](https://en.wikipedia.org/wiki/Operational_transformation),
      and can be used for collaborative editing.
      */map(other,before=false){return other.empty?this:mapSet(this,other,before,true);}/**
      Iterate over the changed ranges in the document, calling `f` for
      each, with the range in the original document (`fromA`-`toA`)
      and the range that replaces it in the new document
      (`fromB`-`toB`).
      
      When `individual` is true, adjacent changes are reported
      separately.
      */iterChanges(f,individual=false){iterChanges(this,f,individual);}/**
      Get a [change description](https://codemirror.net/6/docs/ref/#state.ChangeDesc) for this change
      set.
      */get desc(){return ChangeDesc.create(this.sections);}/**
      @internal
      */filter(ranges){let resultSections=[],resultInserted=[],filteredSections=[];let iter=new SectionIter(this);done:for(let i=0,pos=0;;){let next=i==ranges.length?1e9:ranges[i++];while(pos<next||pos==next&&iter.len==0){if(iter.done)break done;let len=Math.min(iter.len,next-pos);addSection(filteredSections,len,-1);let ins=iter.ins==-1?-1:iter.off==0?iter.ins:0;addSection(resultSections,len,ins);if(ins>0)addInsert(resultInserted,resultSections,iter.text);iter.forward(len);pos+=len;}let end=ranges[i++];while(pos<end){if(iter.done)break done;let len=Math.min(iter.len,end-pos);addSection(resultSections,len,-1);addSection(filteredSections,len,iter.ins==-1?-1:iter.off==0?iter.ins:0);iter.forward(len);pos+=len;}}return{changes:new ChangeSet(resultSections,resultInserted),filtered:ChangeDesc.create(filteredSections)};}/**
      Serialize this change set to a JSON-representable value.
      */toJSON(){let parts=[];for(let i=0;i<this.sections.length;i+=2){let len=this.sections[i],ins=this.sections[i+1];if(ins<0)parts.push(len);else if(ins==0)parts.push([len]);else parts.push([len].concat(this.inserted[i>>1].toJSON()));}return parts;}/**
      Create a change set for the given changes, for a document of the
      given length, using `lineSep` as line separator.
      */static of(changes,length,lineSep){let sections=[],inserted=[],pos=0;let total=null;function flush(force=false){if(!force&&!sections.length)return;if(pos<length)addSection(sections,length-pos,-1);let set=new ChangeSet(sections,inserted);total=total?total.compose(set.map(total)):set;sections=[];inserted=[];pos=0;}function process(spec){if(Array.isArray(spec)){for(let sub of spec)process(sub);}else if(spec instanceof ChangeSet){if(spec.length!=length)throw new RangeError(`Mismatched change set length (got ${spec.length}, expected ${length})`);flush();total=total?total.compose(spec.map(total)):spec;}else{let{from,to=from,insert}=spec;if(from>to||from<0||to>length)throw new RangeError(`Invalid change range ${from} to ${to} (in doc of length ${length})`);let insText=!insert?Text.empty:typeof insert=="string"?Text.of(insert.split(lineSep||DefaultSplit)):insert;let insLen=insText.length;if(from==to&&insLen==0)return;if(from<pos)flush();if(from>pos)addSection(sections,from-pos,-1);addSection(sections,to-from,insLen);addInsert(inserted,sections,insText);pos=to;}}process(changes);flush(!total);return total;}/**
      Create an empty changeset of the given length.
      */static empty(length){return new ChangeSet(length?[length,-1]:[],[]);}/**
      Create a changeset from its JSON representation (as produced by
      [`toJSON`](https://codemirror.net/6/docs/ref/#state.ChangeSet.toJSON).
      */static fromJSON(json){if(!Array.isArray(json))throw new RangeError("Invalid JSON representation of ChangeSet");let sections=[],inserted=[];for(let i=0;i<json.length;i++){let part=json[i];if(typeof part=="number"){sections.push(part,-1);}else if(!Array.isArray(part)||typeof part[0]!="number"||part.some((e,i)=>i&&typeof e!="string")){throw new RangeError("Invalid JSON representation of ChangeSet");}else if(part.length==1){sections.push(part[0],0);}else{while(inserted.length<i)inserted.push(Text.empty);inserted[i]=Text.of(part.slice(1));sections.push(part[0],inserted[i].length);}}return new ChangeSet(sections,inserted);}/**
      @internal
      */static createSet(sections,inserted){return new ChangeSet(sections,inserted);}}function addSection(sections,len,ins,forceJoin=false){if(len==0&&ins<=0)return;let last=sections.length-2;if(last>=0&&ins<=0&&ins==sections[last+1])sections[last]+=len;else if(len==0&&sections[last]==0)sections[last+1]+=ins;else if(forceJoin){sections[last]+=len;sections[last+1]+=ins;}else sections.push(len,ins);}function addInsert(values,sections,value){if(value.length==0)return;let index=sections.length-2>>1;if(index<values.length){values[values.length-1]=values[values.length-1].append(value);}else{while(values.length<index)values.push(Text.empty);values.push(value);}}function iterChanges(desc,f,individual){let inserted=desc.inserted;for(let posA=0,posB=0,i=0;i<desc.sections.length;){let len=desc.sections[i++],ins=desc.sections[i++];if(ins<0){posA+=len;posB+=len;}else{let endA=posA,endB=posB,text=Text.empty;for(;;){endA+=len;endB+=ins;if(ins&&inserted)text=text.append(inserted[i-2>>1]);if(individual||i==desc.sections.length||desc.sections[i+1]<0)break;len=desc.sections[i++];ins=desc.sections[i++];}f(posA,endA,posB,endB,text);posA=endA;posB=endB;}}}function mapSet(setA,setB,before,mkSet=false){// Produce a copy of setA that applies to the document after setB
// has been applied (assuming both start at the same document).
let sections=[],insert=mkSet?[]:null;let a=new SectionIter(setA),b=new SectionIter(setB);// Iterate over both sets in parallel. inserted tracks, for changes
// in A that have to be processed piece-by-piece, whether their
// content has been inserted already, and refers to the section
// index.
for(let inserted=-1;;){if(a.ins==-1&&b.ins==-1){// Move across ranges skipped by both sets.
let len=Math.min(a.len,b.len);addSection(sections,len,-1);a.forward(len);b.forward(len);}else if(b.ins>=0&&(a.ins<0||inserted==a.i||a.off==0&&(b.len<a.len||b.len==a.len&&!before))){// If there's a change in B that comes before the next change in
// A (ordered by start pos, then len, then before flag), skip
// that (and process any changes in A it covers).
let len=b.len;addSection(sections,b.ins,-1);while(len){let piece=Math.min(a.len,len);if(a.ins>=0&&inserted<a.i&&a.len<=piece){addSection(sections,0,a.ins);if(insert)addInsert(insert,sections,a.text);inserted=a.i;}a.forward(piece);len-=piece;}b.next();}else if(a.ins>=0){// Process the part of a change in A up to the start of the next
// non-deletion change in B (if overlapping).
let len=0,left=a.len;while(left){if(b.ins==-1){let piece=Math.min(left,b.len);len+=piece;left-=piece;b.forward(piece);}else if(b.ins==0&&b.len<left){left-=b.len;b.next();}else{break;}}addSection(sections,len,inserted<a.i?a.ins:0);if(insert&&inserted<a.i)addInsert(insert,sections,a.text);inserted=a.i;a.forward(a.len-left);}else if(a.done&&b.done){return insert?ChangeSet.createSet(sections,insert):ChangeDesc.create(sections);}else{throw new Error("Mismatched change set lengths");}}}function composeSets(setA,setB,mkSet=false){let sections=[];let insert=mkSet?[]:null;let a=new SectionIter(setA),b=new SectionIter(setB);for(let open=false;;){if(a.done&&b.done){return insert?ChangeSet.createSet(sections,insert):ChangeDesc.create(sections);}else if(a.ins==0){// Deletion in A
addSection(sections,a.len,0,open);a.next();}else if(b.len==0&&!b.done){// Insertion in B
addSection(sections,0,b.ins,open);if(insert)addInsert(insert,sections,b.text);b.next();}else if(a.done||b.done){throw new Error("Mismatched change set lengths");}else{let len=Math.min(a.len2,b.len),sectionLen=sections.length;if(a.ins==-1){let insB=b.ins==-1?-1:b.off?0:b.ins;addSection(sections,len,insB,open);if(insert&&insB)addInsert(insert,sections,b.text);}else if(b.ins==-1){addSection(sections,a.off?0:a.len,len,open);if(insert)addInsert(insert,sections,a.textBit(len));}else{addSection(sections,a.off?0:a.len,b.off?0:b.ins,open);if(insert&&!b.off)addInsert(insert,sections,b.text);}open=(a.ins>len||b.ins>=0&&b.len>len)&&(open||sections.length>sectionLen);a.forward2(len);b.forward(len);}}}class SectionIter{constructor(set){this.set=set;this.i=0;this.next();}next(){let{sections}=this.set;if(this.i<sections.length){this.len=sections[this.i++];this.ins=sections[this.i++];}else{this.len=0;this.ins=-2;}this.off=0;}get done(){return this.ins==-2;}get len2(){return this.ins<0?this.len:this.ins;}get text(){let{inserted}=this.set,index=this.i-2>>1;return index>=inserted.length?Text.empty:inserted[index];}textBit(len){let{inserted}=this.set,index=this.i-2>>1;return index>=inserted.length&&!len?Text.empty:inserted[index].slice(this.off,len==null?undefined:this.off+len);}forward(len){if(len==this.len)this.next();else{this.len-=len;this.off+=len;}}forward2(len){if(this.ins==-1)this.forward(len);else if(len==this.ins)this.next();else{this.ins-=len;this.off+=len;}}}/**
  A single selection range. When
  [`allowMultipleSelections`](https://codemirror.net/6/docs/ref/#state.EditorState^allowMultipleSelections)
  is enabled, a [selection](https://codemirror.net/6/docs/ref/#state.EditorSelection) may hold
  multiple ranges. By default, selections hold exactly one range.
  */class SelectionRange{constructor(/**
      The lower boundary of the range.
      */from,/**
      The upper boundary of the range.
      */to,flags){this.from=from;this.to=to;this.flags=flags;}/**
      The anchor of the range—the side that doesn't move when you
      extend it.
      */get anchor(){return this.flags&32/* RangeFlag.Inverted */?this.to:this.from;}/**
      The head of the range, which is moved when the range is
      [extended](https://codemirror.net/6/docs/ref/#state.SelectionRange.extend).
      */get head(){return this.flags&32/* RangeFlag.Inverted */?this.from:this.to;}/**
      True when `anchor` and `head` are at the same position.
      */get empty(){return this.from==this.to;}/**
      If this is a cursor that is explicitly associated with the
      character on one of its sides, this returns the side. -1 means
      the character before its position, 1 the character after, and 0
      means no association.
      */get assoc(){return this.flags&8/* RangeFlag.AssocBefore */?-1:this.flags&16/* RangeFlag.AssocAfter */?1:0;}/**
      The bidirectional text level associated with this cursor, if
      any.
      */get bidiLevel(){let level=this.flags&7/* RangeFlag.BidiLevelMask */;return level==7?null:level;}/**
      The goal column (stored vertical offset) associated with a
      cursor. This is used to preserve the vertical position when
      [moving](https://codemirror.net/6/docs/ref/#view.EditorView.moveVertically) across
      lines of different length.
      */get goalColumn(){let value=this.flags>>6/* RangeFlag.GoalColumnOffset */;return value==16777215/* RangeFlag.NoGoalColumn */?undefined:value;}/**
      Map this range through a change, producing a valid range in the
      updated document.
      */map(change,assoc=-1){let from,to;if(this.empty){from=to=change.mapPos(this.from,assoc);}else{from=change.mapPos(this.from,1);to=change.mapPos(this.to,-1);}return from==this.from&&to==this.to?this:new SelectionRange(from,to,this.flags);}/**
      Extend this range to cover at least `from` to `to`.
      */extend(from,to=from){if(from<=this.anchor&&to>=this.anchor)return EditorSelection.range(from,to);let head=Math.abs(from-this.anchor)>Math.abs(to-this.anchor)?from:to;return EditorSelection.range(this.anchor,head);}/**
      Compare this range to another range.
      */eq(other,includeAssoc=false){return this.anchor==other.anchor&&this.head==other.head&&(!includeAssoc||!this.empty||this.assoc==other.assoc);}/**
      Return a JSON-serializable object representing the range.
      */toJSON(){return{anchor:this.anchor,head:this.head};}/**
      Convert a JSON representation of a range to a `SelectionRange`
      instance.
      */static fromJSON(json){if(!json||typeof json.anchor!="number"||typeof json.head!="number")throw new RangeError("Invalid JSON representation for SelectionRange");return EditorSelection.range(json.anchor,json.head);}/**
      @internal
      */static create(from,to,flags){return new SelectionRange(from,to,flags);}}/**
  An editor selection holds one or more selection ranges.
  */class EditorSelection{constructor(/**
      The ranges in the selection, sorted by position. Ranges cannot
      overlap (but they may touch, if they aren't empty).
      */ranges,/**
      The index of the _main_ range in the selection (which is
      usually the range that was added last).
      */mainIndex){this.ranges=ranges;this.mainIndex=mainIndex;}/**
      Map a selection through a change. Used to adjust the selection
      position for changes.
      */map(change,assoc=-1){if(change.empty)return this;return EditorSelection.create(this.ranges.map(r=>r.map(change,assoc)),this.mainIndex);}/**
      Compare this selection to another selection. By default, ranges
      are compared only by position. When `includeAssoc` is true,
      cursor ranges must also have the same
      [`assoc`](https://codemirror.net/6/docs/ref/#state.SelectionRange.assoc) value.
      */eq(other,includeAssoc=false){if(this.ranges.length!=other.ranges.length||this.mainIndex!=other.mainIndex)return false;for(let i=0;i<this.ranges.length;i++)if(!this.ranges[i].eq(other.ranges[i],includeAssoc))return false;return true;}/**
      Get the primary selection range. Usually, you should make sure
      your code applies to _all_ ranges, by using methods like
      [`changeByRange`](https://codemirror.net/6/docs/ref/#state.EditorState.changeByRange).
      */get main(){return this.ranges[this.mainIndex];}/**
      Make sure the selection only has one range. Returns a selection
      holding only the main range from this selection.
      */asSingle(){return this.ranges.length==1?this:new EditorSelection([this.main],0);}/**
      Extend this selection with an extra range.
      */addRange(range,main=true){return EditorSelection.create([range].concat(this.ranges),main?0:this.mainIndex+1);}/**
      Replace a given range with another range, and then normalize the
      selection to merge and sort ranges if necessary.
      */replaceRange(range,which=this.mainIndex){let ranges=this.ranges.slice();ranges[which]=range;return EditorSelection.create(ranges,this.mainIndex);}/**
      Convert this selection to an object that can be serialized to
      JSON.
      */toJSON(){return{ranges:this.ranges.map(r=>r.toJSON()),main:this.mainIndex};}/**
      Create a selection from a JSON representation.
      */static fromJSON(json){if(!json||!Array.isArray(json.ranges)||typeof json.main!="number"||json.main>=json.ranges.length)throw new RangeError("Invalid JSON representation for EditorSelection");return new EditorSelection(json.ranges.map(r=>SelectionRange.fromJSON(r)),json.main);}/**
      Create a selection holding a single range.
      */static single(anchor,head=anchor){return new EditorSelection([EditorSelection.range(anchor,head)],0);}/**
      Sort and merge the given set of ranges, creating a valid
      selection.
      */static create(ranges,mainIndex=0){if(ranges.length==0)throw new RangeError("A selection needs at least one range");for(let pos=0,i=0;i<ranges.length;i++){let range=ranges[i];if(range.empty?range.from<=pos:range.from<pos)return EditorSelection.normalized(ranges.slice(),mainIndex);pos=range.to;}return new EditorSelection(ranges,mainIndex);}/**
      Create a cursor selection range at the given position. You can
      safely ignore the optional arguments in most situations.
      */static cursor(pos,assoc=0,bidiLevel,goalColumn){return SelectionRange.create(pos,pos,(assoc==0?0:assoc<0?8/* RangeFlag.AssocBefore */:16/* RangeFlag.AssocAfter */)|(bidiLevel==null?7:Math.min(6,bidiLevel))|(goalColumn!==null&&goalColumn!==void 0?goalColumn:16777215/* RangeFlag.NoGoalColumn */)<<6/* RangeFlag.GoalColumnOffset */);}/**
      Create a selection range.
      */static range(anchor,head,goalColumn,bidiLevel){let flags=(goalColumn!==null&&goalColumn!==void 0?goalColumn:16777215/* RangeFlag.NoGoalColumn */)<<6/* RangeFlag.GoalColumnOffset */|(bidiLevel==null?7:Math.min(6,bidiLevel));return head<anchor?SelectionRange.create(head,anchor,32/* RangeFlag.Inverted */|16/* RangeFlag.AssocAfter */|flags):SelectionRange.create(anchor,head,(head>anchor?8/* RangeFlag.AssocBefore */:0)|flags);}/**
      @internal
      */static normalized(ranges,mainIndex=0){let main=ranges[mainIndex];ranges.sort((a,b)=>a.from-b.from);mainIndex=ranges.indexOf(main);for(let i=1;i<ranges.length;i++){let range=ranges[i],prev=ranges[i-1];if(range.empty?range.from<=prev.to:range.from<prev.to){let from=prev.from,to=Math.max(range.to,prev.to);if(i<=mainIndex)mainIndex--;ranges.splice(--i,2,range.anchor>range.head?EditorSelection.range(to,from):EditorSelection.range(from,to));}}return new EditorSelection(ranges,mainIndex);}}function checkSelection(selection,docLength){for(let range of selection.ranges)if(range.to>docLength)throw new RangeError("Selection points outside of document");}let nextID=0;/**
  A facet is a labeled value that is associated with an editor
  state. It takes inputs from any number of extensions, and combines
  those into a single output value.

  Examples of uses of facets are the [tab
  size](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize), [editor
  attributes](https://codemirror.net/6/docs/ref/#view.EditorView^editorAttributes), and [update
  listeners](https://codemirror.net/6/docs/ref/#view.EditorView^updateListener).

  Note that `Facet` instances can be used anywhere where
  [`FacetReader`](https://codemirror.net/6/docs/ref/#state.FacetReader) is expected.
  */class Facet{constructor(/**
      @internal
      */combine,/**
      @internal
      */compareInput,/**
      @internal
      */compare,isStatic,enables){this.combine=combine;this.compareInput=compareInput;this.compare=compare;this.isStatic=isStatic;/**
          @internal
          */this.id=nextID++;this.default=combine([]);this.extensions=typeof enables=="function"?enables(this):enables;}/**
      Returns a facet reader for this facet, which can be used to
      [read](https://codemirror.net/6/docs/ref/#state.EditorState.facet) it but not to define values for it.
      */get reader(){return this;}/**
      Define a new facet.
      */static define(config={}){return new Facet(config.combine||(a=>a),config.compareInput||((a,b)=>a===b),config.compare||(!config.combine?sameArray$1:(a,b)=>a===b),!!config.static,config.enables);}/**
      Returns an extension that adds the given value to this facet.
      */of(value){return new FacetProvider([],this,0/* Provider.Static */,value);}/**
      Create an extension that computes a value for the facet from a
      state. You must take care to declare the parts of the state that
      this value depends on, since your function is only called again
      for a new state when one of those parts changed.
      
      In cases where your value depends only on a single field, you'll
      want to use the [`from`](https://codemirror.net/6/docs/ref/#state.Facet.from) method instead.
      */compute(deps,get){if(this.isStatic)throw new Error("Can't compute a static facet");return new FacetProvider(deps,this,1/* Provider.Single */,get);}/**
      Create an extension that computes zero or more values for this
      facet from a state.
      */computeN(deps,get){if(this.isStatic)throw new Error("Can't compute a static facet");return new FacetProvider(deps,this,2/* Provider.Multi */,get);}from(field,get){if(!get)get=x=>x;return this.compute([field],state=>get(state.field(field)));}}function sameArray$1(a,b){return a==b||a.length==b.length&&a.every((e,i)=>e===b[i]);}class FacetProvider{constructor(dependencies,facet,type,value){this.dependencies=dependencies;this.facet=facet;this.type=type;this.value=value;this.id=nextID++;}dynamicSlot(addresses){var _a;let getter=this.value;let compare=this.facet.compareInput;let id=this.id,idx=addresses[id]>>1,multi=this.type==2/* Provider.Multi */;let depDoc=false,depSel=false,depAddrs=[];for(let dep of this.dependencies){if(dep=="doc")depDoc=true;else if(dep=="selection")depSel=true;else if((((_a=addresses[dep.id])!==null&&_a!==void 0?_a:1)&1)==0)depAddrs.push(addresses[dep.id]);}return{create(state){state.values[idx]=getter(state);return 1/* SlotStatus.Changed */;},update(state,tr){if(depDoc&&tr.docChanged||depSel&&(tr.docChanged||tr.selection)||ensureAll(state,depAddrs)){let newVal=getter(state);if(multi?!compareArray(newVal,state.values[idx],compare):!compare(newVal,state.values[idx])){state.values[idx]=newVal;return 1/* SlotStatus.Changed */;}}return 0;},reconfigure:(state,oldState)=>{let newVal,oldAddr=oldState.config.address[id];if(oldAddr!=null){let oldVal=getAddr(oldState,oldAddr);if(this.dependencies.every(dep=>{return dep instanceof Facet?oldState.facet(dep)===state.facet(dep):dep instanceof StateField?oldState.field(dep,false)==state.field(dep,false):true;})||(multi?compareArray(newVal=getter(state),oldVal,compare):compare(newVal=getter(state),oldVal))){state.values[idx]=oldVal;return 0;}}else{newVal=getter(state);}state.values[idx]=newVal;return 1/* SlotStatus.Changed */;}};}}function compareArray(a,b,compare){if(a.length!=b.length)return false;for(let i=0;i<a.length;i++)if(!compare(a[i],b[i]))return false;return true;}function ensureAll(state,addrs){let changed=false;for(let addr of addrs)if(ensureAddr(state,addr)&1/* SlotStatus.Changed */)changed=true;return changed;}function dynamicFacetSlot(addresses,facet,providers){let providerAddrs=providers.map(p=>addresses[p.id]);let providerTypes=providers.map(p=>p.type);let dynamic=providerAddrs.filter(p=>!(p&1));let idx=addresses[facet.id]>>1;function get(state){let values=[];for(let i=0;i<providerAddrs.length;i++){let value=getAddr(state,providerAddrs[i]);if(providerTypes[i]==2/* Provider.Multi */)for(let val of value)values.push(val);else values.push(value);}return facet.combine(values);}return{create(state){for(let addr of providerAddrs)ensureAddr(state,addr);state.values[idx]=get(state);return 1/* SlotStatus.Changed */;},update(state,tr){if(!ensureAll(state,dynamic))return 0;let value=get(state);if(facet.compare(value,state.values[idx]))return 0;state.values[idx]=value;return 1/* SlotStatus.Changed */;},reconfigure(state,oldState){let depChanged=ensureAll(state,providerAddrs);let oldProviders=oldState.config.facets[facet.id],oldValue=oldState.facet(facet);if(oldProviders&&!depChanged&&sameArray$1(providers,oldProviders)){state.values[idx]=oldValue;return 0;}let value=get(state);if(facet.compare(value,oldValue)){state.values[idx]=oldValue;return 0;}state.values[idx]=value;return 1/* SlotStatus.Changed */;}};}const initField=/*@__PURE__*/Facet.define({static:true});/**
  Fields can store additional information in an editor state, and
  keep it in sync with the rest of the state.
  */class StateField{constructor(/**
      @internal
      */id,createF,updateF,compareF,/**
      @internal
      */spec){this.id=id;this.createF=createF;this.updateF=updateF;this.compareF=compareF;this.spec=spec;/**
          @internal
          */this.provides=undefined;}/**
      Define a state field.
      */static define(config){let field=new StateField(nextID++,config.create,config.update,config.compare||((a,b)=>a===b),config);if(config.provide)field.provides=config.provide(field);return field;}create(state){let init=state.facet(initField).find(i=>i.field==this);return((init===null||init===void 0?void 0:init.create)||this.createF)(state);}/**
      @internal
      */slot(addresses){let idx=addresses[this.id]>>1;return{create:state=>{state.values[idx]=this.create(state);return 1/* SlotStatus.Changed */;},update:(state,tr)=>{let oldVal=state.values[idx];let value=this.updateF(oldVal,tr);if(this.compareF(oldVal,value))return 0;state.values[idx]=value;return 1/* SlotStatus.Changed */;},reconfigure:(state,oldState)=>{if(oldState.config.address[this.id]!=null){state.values[idx]=oldState.field(this);return 0;}state.values[idx]=this.create(state);return 1/* SlotStatus.Changed */;}};}/**
      Returns an extension that enables this field and overrides the
      way it is initialized. Can be useful when you need to provide a
      non-default starting value for the field.
      */init(create){return[this,initField.of({field:this,create})];}/**
      State field instances can be used as
      [`Extension`](https://codemirror.net/6/docs/ref/#state.Extension) values to enable the field in a
      given state.
      */get extension(){return this;}}const Prec_={lowest:4,low:3,default:2,high:1,highest:0};function prec(value){return ext=>new PrecExtension(ext,value);}/**
  By default extensions are registered in the order they are found
  in the flattened form of nested array that was provided.
  Individual extension values can be assigned a precedence to
  override this. Extensions that do not have a precedence set get
  the precedence of the nearest parent with a precedence, or
  [`default`](https://codemirror.net/6/docs/ref/#state.Prec.default) if there is no such parent. The
  final ordering of extensions is determined by first sorting by
  precedence and then by order within each precedence.
  */const Prec={/**
      The highest precedence level, for extensions that should end up
      near the start of the precedence ordering.
      */highest:/*@__PURE__*/prec(Prec_.highest),/**
      A higher-than-default precedence, for extensions that should
      come before those with default precedence.
      */high:/*@__PURE__*/prec(Prec_.high),/**
      The default precedence, which is also used for extensions
      without an explicit precedence.
      */default:/*@__PURE__*/prec(Prec_.default),/**
      A lower-than-default precedence.
      */low:/*@__PURE__*/prec(Prec_.low),/**
      The lowest precedence level. Meant for things that should end up
      near the end of the extension order.
      */lowest:/*@__PURE__*/prec(Prec_.lowest)};class PrecExtension{constructor(inner,prec){this.inner=inner;this.prec=prec;}}/**
  Extension compartments can be used to make a configuration
  dynamic. By [wrapping](https://codemirror.net/6/docs/ref/#state.Compartment.of) part of your
  configuration in a compartment, you can later
  [replace](https://codemirror.net/6/docs/ref/#state.Compartment.reconfigure) that part through a
  transaction.
  */class Compartment{/**
      Create an instance of this compartment to add to your [state
      configuration](https://codemirror.net/6/docs/ref/#state.EditorStateConfig.extensions).
      */of(ext){return new CompartmentInstance(this,ext);}/**
      Create an [effect](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) that
      reconfigures this compartment.
      */reconfigure(content){return Compartment.reconfigure.of({compartment:this,extension:content});}/**
      Get the current content of the compartment in the state, or
      `undefined` if it isn't present.
      */get(state){return state.config.compartments.get(this);}}class CompartmentInstance{constructor(compartment,inner){this.compartment=compartment;this.inner=inner;}}class Configuration{constructor(base,compartments,dynamicSlots,address,staticValues,facets){this.base=base;this.compartments=compartments;this.dynamicSlots=dynamicSlots;this.address=address;this.staticValues=staticValues;this.facets=facets;this.statusTemplate=[];while(this.statusTemplate.length<dynamicSlots.length)this.statusTemplate.push(0/* SlotStatus.Unresolved */);}staticFacet(facet){let addr=this.address[facet.id];return addr==null?facet.default:this.staticValues[addr>>1];}static resolve(base,compartments,oldState){let fields=[];let facets=Object.create(null);let newCompartments=new Map();for(let ext of flatten(base,compartments,newCompartments)){if(ext instanceof StateField)fields.push(ext);else(facets[ext.facet.id]||(facets[ext.facet.id]=[])).push(ext);}let address=Object.create(null);let staticValues=[];let dynamicSlots=[];for(let field of fields){address[field.id]=dynamicSlots.length<<1;dynamicSlots.push(a=>field.slot(a));}let oldFacets=oldState===null||oldState===void 0?void 0:oldState.config.facets;for(let id in facets){let providers=facets[id],facet=providers[0].facet;let oldProviders=oldFacets&&oldFacets[id]||[];if(providers.every(p=>p.type==0/* Provider.Static */)){address[facet.id]=staticValues.length<<1|1;if(sameArray$1(oldProviders,providers)){staticValues.push(oldState.facet(facet));}else{let value=facet.combine(providers.map(p=>p.value));staticValues.push(oldState&&facet.compare(value,oldState.facet(facet))?oldState.facet(facet):value);}}else{for(let p of providers){if(p.type==0/* Provider.Static */){address[p.id]=staticValues.length<<1|1;staticValues.push(p.value);}else{address[p.id]=dynamicSlots.length<<1;dynamicSlots.push(a=>p.dynamicSlot(a));}}address[facet.id]=dynamicSlots.length<<1;dynamicSlots.push(a=>dynamicFacetSlot(a,facet,providers));}}let dynamic=dynamicSlots.map(f=>f(address));return new Configuration(base,newCompartments,dynamic,address,staticValues,facets);}}function flatten(extension,compartments,newCompartments){let result=[[],[],[],[],[]];let seen=new Map();function inner(ext,prec){let known=seen.get(ext);if(known!=null){if(known<=prec)return;let found=result[known].indexOf(ext);if(found>-1)result[known].splice(found,1);if(ext instanceof CompartmentInstance)newCompartments.delete(ext.compartment);}seen.set(ext,prec);if(Array.isArray(ext)){for(let e of ext)inner(e,prec);}else if(ext instanceof CompartmentInstance){if(newCompartments.has(ext.compartment))throw new RangeError(`Duplicate use of compartment in extensions`);let content=compartments.get(ext.compartment)||ext.inner;newCompartments.set(ext.compartment,content);inner(content,prec);}else if(ext instanceof PrecExtension){inner(ext.inner,ext.prec);}else if(ext instanceof StateField){result[prec].push(ext);if(ext.provides)inner(ext.provides,prec);}else if(ext instanceof FacetProvider){result[prec].push(ext);if(ext.facet.extensions)inner(ext.facet.extensions,Prec_.default);}else{let content=ext.extension;if(!content)throw new Error(`Unrecognized extension value in extension set (${ext}). This sometimes happens because multiple instances of @codemirror/state are loaded, breaking instanceof checks.`);inner(content,prec);}}inner(extension,Prec_.default);return result.reduce((a,b)=>a.concat(b));}function ensureAddr(state,addr){if(addr&1)return 2/* SlotStatus.Computed */;let idx=addr>>1;let status=state.status[idx];if(status==4/* SlotStatus.Computing */)throw new Error("Cyclic dependency between fields and/or facets");if(status&2/* SlotStatus.Computed */)return status;state.status[idx]=4/* SlotStatus.Computing */;let changed=state.computeSlot(state,state.config.dynamicSlots[idx]);return state.status[idx]=2/* SlotStatus.Computed */|changed;}function getAddr(state,addr){return addr&1?state.config.staticValues[addr>>1]:state.values[addr>>1];}const languageData=/*@__PURE__*/Facet.define();const allowMultipleSelections=/*@__PURE__*/Facet.define({combine:values=>values.some(v=>v),static:true});const lineSeparator=/*@__PURE__*/Facet.define({combine:values=>values.length?values[0]:undefined,static:true});const changeFilter=/*@__PURE__*/Facet.define();const transactionFilter=/*@__PURE__*/Facet.define();const transactionExtender=/*@__PURE__*/Facet.define();const readOnly=/*@__PURE__*/Facet.define({combine:values=>values.length?values[0]:false});/**
  Annotations are tagged values that are used to add metadata to
  transactions in an extensible way. They should be used to model
  things that effect the entire transaction (such as its [time
  stamp](https://codemirror.net/6/docs/ref/#state.Transaction^time) or information about its
  [origin](https://codemirror.net/6/docs/ref/#state.Transaction^userEvent)). For effects that happen
  _alongside_ the other changes made by the transaction, [state
  effects](https://codemirror.net/6/docs/ref/#state.StateEffect) are more appropriate.
  */class Annotation{/**
      @internal
      */constructor(/**
      The annotation type.
      */type,/**
      The value of this annotation.
      */value){this.type=type;this.value=value;}/**
      Define a new type of annotation.
      */static define(){return new AnnotationType();}}/**
  Marker that identifies a type of [annotation](https://codemirror.net/6/docs/ref/#state.Annotation).
  */class AnnotationType{/**
      Create an instance of this annotation.
      */of(value){return new Annotation(this,value);}}/**
  Representation of a type of state effect. Defined with
  [`StateEffect.define`](https://codemirror.net/6/docs/ref/#state.StateEffect^define).
  */class StateEffectType{/**
      @internal
      */constructor(// The `any` types in these function types are there to work
// around TypeScript issue #37631, where the type guard on
// `StateEffect.is` mysteriously stops working when these properly
// have type `Value`.
/**
      @internal
      */map){this.map=map;}/**
      Create a [state effect](https://codemirror.net/6/docs/ref/#state.StateEffect) instance of this
      type.
      */of(value){return new StateEffect(this,value);}}/**
  State effects can be used to represent additional effects
  associated with a [transaction](https://codemirror.net/6/docs/ref/#state.Transaction.effects). They
  are often useful to model changes to custom [state
  fields](https://codemirror.net/6/docs/ref/#state.StateField), when those changes aren't implicit in
  document or selection changes.
  */class StateEffect{/**
      @internal
      */constructor(/**
      @internal
      */type,/**
      The value of this effect.
      */value){this.type=type;this.value=value;}/**
      Map this effect through a position mapping. Will return
      `undefined` when that ends up deleting the effect.
      */map(mapping){let mapped=this.type.map(this.value,mapping);return mapped===undefined?undefined:mapped==this.value?this:new StateEffect(this.type,mapped);}/**
      Tells you whether this effect object is of a given
      [type](https://codemirror.net/6/docs/ref/#state.StateEffectType).
      */is(type){return this.type==type;}/**
      Define a new effect type. The type parameter indicates the type
      of values that his effect holds. It should be a type that
      doesn't include `undefined`, since that is used in
      [mapping](https://codemirror.net/6/docs/ref/#state.StateEffect.map) to indicate that an effect is
      removed.
      */static define(spec={}){return new StateEffectType(spec.map||(v=>v));}/**
      Map an array of effects through a change set.
      */static mapEffects(effects,mapping){if(!effects.length)return effects;let result=[];for(let effect of effects){let mapped=effect.map(mapping);if(mapped)result.push(mapped);}return result;}}/**
  This effect can be used to reconfigure the root extensions of
  the editor. Doing this will discard any extensions
  [appended](https://codemirror.net/6/docs/ref/#state.StateEffect^appendConfig), but does not reset
  the content of [reconfigured](https://codemirror.net/6/docs/ref/#state.Compartment.reconfigure)
  compartments.
  */StateEffect.reconfigure=/*@__PURE__*/StateEffect.define();/**
  Append extensions to the top-level configuration of the editor.
  */StateEffect.appendConfig=/*@__PURE__*/StateEffect.define();/**
  Changes to the editor state are grouped into transactions.
  Typically, a user action creates a single transaction, which may
  contain any number of document changes, may change the selection,
  or have other effects. Create a transaction by calling
  [`EditorState.update`](https://codemirror.net/6/docs/ref/#state.EditorState.update), or immediately
  dispatch one by calling
  [`EditorView.dispatch`](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch).
  */class Transaction{constructor(/**
      The state from which the transaction starts.
      */startState,/**
      The document changes made by this transaction.
      */changes,/**
      The selection set by this transaction, or undefined if it
      doesn't explicitly set a selection.
      */selection,/**
      The effects added to the transaction.
      */effects,/**
      @internal
      */annotations,/**
      Whether the selection should be scrolled into view after this
      transaction is dispatched.
      */scrollIntoView){this.startState=startState;this.changes=changes;this.selection=selection;this.effects=effects;this.annotations=annotations;this.scrollIntoView=scrollIntoView;/**
          @internal
          */this._doc=null;/**
          @internal
          */this._state=null;if(selection)checkSelection(selection,changes.newLength);if(!annotations.some(a=>a.type==Transaction.time))this.annotations=annotations.concat(Transaction.time.of(Date.now()));}/**
      @internal
      */static create(startState,changes,selection,effects,annotations,scrollIntoView){return new Transaction(startState,changes,selection,effects,annotations,scrollIntoView);}/**
      The new document produced by the transaction. Contrary to
      [`.state`](https://codemirror.net/6/docs/ref/#state.Transaction.state)`.doc`, accessing this won't
      force the entire new state to be computed right away, so it is
      recommended that [transaction
      filters](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter) use this getter
      when they need to look at the new document.
      */get newDoc(){return this._doc||(this._doc=this.changes.apply(this.startState.doc));}/**
      The new selection produced by the transaction. If
      [`this.selection`](https://codemirror.net/6/docs/ref/#state.Transaction.selection) is undefined,
      this will [map](https://codemirror.net/6/docs/ref/#state.EditorSelection.map) the start state's
      current selection through the changes made by the transaction.
      */get newSelection(){return this.selection||this.startState.selection.map(this.changes);}/**
      The new state created by the transaction. Computed on demand
      (but retained for subsequent access), so it is recommended not to
      access it in [transaction
      filters](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter) when possible.
      */get state(){if(!this._state)this.startState.applyTransaction(this);return this._state;}/**
      Get the value of the given annotation type, if any.
      */annotation(type){for(let ann of this.annotations)if(ann.type==type)return ann.value;return undefined;}/**
      Indicates whether the transaction changed the document.
      */get docChanged(){return!this.changes.empty;}/**
      Indicates whether this transaction reconfigures the state
      (through a [configuration compartment](https://codemirror.net/6/docs/ref/#state.Compartment) or
      with a top-level configuration
      [effect](https://codemirror.net/6/docs/ref/#state.StateEffect^reconfigure).
      */get reconfigured(){return this.startState.config!=this.state.config;}/**
      Returns true if the transaction has a [user
      event](https://codemirror.net/6/docs/ref/#state.Transaction^userEvent) annotation that is equal to
      or more specific than `event`. For example, if the transaction
      has `"select.pointer"` as user event, `"select"` and
      `"select.pointer"` will match it.
      */isUserEvent(event){let e=this.annotation(Transaction.userEvent);return!!(e&&(e==event||e.length>event.length&&e.slice(0,event.length)==event&&e[event.length]=="."));}}/**
  Annotation used to store transaction timestamps. Automatically
  added to every transaction, holding `Date.now()`.
  */Transaction.time=/*@__PURE__*/Annotation.define();/**
  Annotation used to associate a transaction with a user interface
  event. Holds a string identifying the event, using a
  dot-separated format to support attaching more specific
  information. The events used by the core libraries are:

   - `"input"` when content is entered
     - `"input.type"` for typed input
       - `"input.type.compose"` for composition
     - `"input.paste"` for pasted input
     - `"input.drop"` when adding content with drag-and-drop
     - `"input.complete"` when autocompleting
   - `"delete"` when the user deletes content
     - `"delete.selection"` when deleting the selection
     - `"delete.forward"` when deleting forward from the selection
     - `"delete.backward"` when deleting backward from the selection
     - `"delete.cut"` when cutting to the clipboard
   - `"move"` when content is moved
     - `"move.drop"` when content is moved within the editor through drag-and-drop
   - `"select"` when explicitly changing the selection
     - `"select.pointer"` when selecting with a mouse or other pointing device
   - `"undo"` and `"redo"` for history actions

  Use [`isUserEvent`](https://codemirror.net/6/docs/ref/#state.Transaction.isUserEvent) to check
  whether the annotation matches a given event.
  */Transaction.userEvent=/*@__PURE__*/Annotation.define();/**
  Annotation indicating whether a transaction should be added to
  the undo history or not.
  */Transaction.addToHistory=/*@__PURE__*/Annotation.define();/**
  Annotation indicating (when present and true) that a transaction
  represents a change made by some other actor, not the user. This
  is used, for example, to tag other people's changes in
  collaborative editing.
  */Transaction.remote=/*@__PURE__*/Annotation.define();function joinRanges(a,b){let result=[];for(let iA=0,iB=0;;){let from,to;if(iA<a.length&&(iB==b.length||b[iB]>=a[iA])){from=a[iA++];to=a[iA++];}else if(iB<b.length){from=b[iB++];to=b[iB++];}else return result;if(!result.length||result[result.length-1]<from)result.push(from,to);else if(result[result.length-1]<to)result[result.length-1]=to;}}function mergeTransaction(a,b,sequential){var _a;let mapForA,mapForB,changes;if(sequential){mapForA=b.changes;mapForB=ChangeSet.empty(b.changes.length);changes=a.changes.compose(b.changes);}else{mapForA=b.changes.map(a.changes);mapForB=a.changes.mapDesc(b.changes,true);changes=a.changes.compose(mapForA);}return{changes,selection:b.selection?b.selection.map(mapForB):(_a=a.selection)===null||_a===void 0?void 0:_a.map(mapForA),effects:StateEffect.mapEffects(a.effects,mapForA).concat(StateEffect.mapEffects(b.effects,mapForB)),annotations:a.annotations.length?a.annotations.concat(b.annotations):b.annotations,scrollIntoView:a.scrollIntoView||b.scrollIntoView};}function resolveTransactionInner(state,spec,docSize){let sel=spec.selection,annotations=asArray$1(spec.annotations);if(spec.userEvent)annotations=annotations.concat(Transaction.userEvent.of(spec.userEvent));return{changes:spec.changes instanceof ChangeSet?spec.changes:ChangeSet.of(spec.changes||[],docSize,state.facet(lineSeparator)),selection:sel&&(sel instanceof EditorSelection?sel:EditorSelection.single(sel.anchor,sel.head)),effects:asArray$1(spec.effects),annotations,scrollIntoView:!!spec.scrollIntoView};}function resolveTransaction(state,specs,filter){let s=resolveTransactionInner(state,specs.length?specs[0]:{},state.doc.length);if(specs.length&&specs[0].filter===false)filter=false;for(let i=1;i<specs.length;i++){if(specs[i].filter===false)filter=false;let seq=!!specs[i].sequential;s=mergeTransaction(s,resolveTransactionInner(state,specs[i],seq?s.changes.newLength:state.doc.length),seq);}let tr=Transaction.create(state,s.changes,s.selection,s.effects,s.annotations,s.scrollIntoView);return extendTransaction(filter?filterTransaction(tr):tr);}// Finish a transaction by applying filters if necessary.
function filterTransaction(tr){let state=tr.startState;// Change filters
let result=true;for(let filter of state.facet(changeFilter)){let value=filter(tr);if(value===false){result=false;break;}if(Array.isArray(value))result=result===true?value:joinRanges(result,value);}if(result!==true){let changes,back;if(result===false){back=tr.changes.invertedDesc;changes=ChangeSet.empty(state.doc.length);}else{let filtered=tr.changes.filter(result);changes=filtered.changes;back=filtered.filtered.mapDesc(filtered.changes).invertedDesc;}tr=Transaction.create(state,changes,tr.selection&&tr.selection.map(back),StateEffect.mapEffects(tr.effects,back),tr.annotations,tr.scrollIntoView);}// Transaction filters
let filters=state.facet(transactionFilter);for(let i=filters.length-1;i>=0;i--){let filtered=filters[i](tr);if(filtered instanceof Transaction)tr=filtered;else if(Array.isArray(filtered)&&filtered.length==1&&filtered[0]instanceof Transaction)tr=filtered[0];else tr=resolveTransaction(state,asArray$1(filtered),false);}return tr;}function extendTransaction(tr){let state=tr.startState,extenders=state.facet(transactionExtender),spec=tr;for(let i=extenders.length-1;i>=0;i--){let extension=extenders[i](tr);if(extension&&Object.keys(extension).length)spec=mergeTransaction(spec,resolveTransactionInner(state,extension,tr.changes.newLength),true);}return spec==tr?tr:Transaction.create(state,tr.changes,tr.selection,spec.effects,spec.annotations,spec.scrollIntoView);}const none$2=[];function asArray$1(value){return value==null?none$2:Array.isArray(value)?value:[value];}/**
  The categories produced by a [character
  categorizer](https://codemirror.net/6/docs/ref/#state.EditorState.charCategorizer). These are used
  do things like selecting by word.
  */var CharCategory=/*@__PURE__*/function(CharCategory){/**
      Word characters.
      */CharCategory[CharCategory["Word"]=0]="Word";/**
      Whitespace.
      */CharCategory[CharCategory["Space"]=1]="Space";/**
      Anything else.
      */CharCategory[CharCategory["Other"]=2]="Other";return CharCategory;}(CharCategory||(CharCategory={}));const nonASCIISingleCaseWordChar=/[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;let wordChar;try{wordChar=/*@__PURE__*/new RegExp("[\\p{Alphabetic}\\p{Number}_]","u");}catch(_){}function hasWordChar(str){if(wordChar)return wordChar.test(str);for(let i=0;i<str.length;i++){let ch=str[i];if(/\w/.test(ch)||ch>"\x80"&&(ch.toUpperCase()!=ch.toLowerCase()||nonASCIISingleCaseWordChar.test(ch)))return true;}return false;}function makeCategorizer(wordChars){return char=>{if(!/\S/.test(char))return CharCategory.Space;if(hasWordChar(char))return CharCategory.Word;for(let i=0;i<wordChars.length;i++)if(char.indexOf(wordChars[i])>-1)return CharCategory.Word;return CharCategory.Other;};}/**
  The editor state class is a persistent (immutable) data structure.
  To update a state, you [create](https://codemirror.net/6/docs/ref/#state.EditorState.update) a
  [transaction](https://codemirror.net/6/docs/ref/#state.Transaction), which produces a _new_ state
  instance, without modifying the original object.

  As such, _never_ mutate properties of a state directly. That'll
  just break things.
  */class EditorState{constructor(/**
      @internal
      */config,/**
      The current document.
      */doc,/**
      The current selection.
      */selection,/**
      @internal
      */values,computeSlot,tr){this.config=config;this.doc=doc;this.selection=selection;this.values=values;this.status=config.statusTemplate.slice();this.computeSlot=computeSlot;// Fill in the computed state immediately, so that further queries
// for it made during the update return this state
if(tr)tr._state=this;for(let i=0;i<this.config.dynamicSlots.length;i++)ensureAddr(this,i<<1);this.computeSlot=null;}field(field,require=true){let addr=this.config.address[field.id];if(addr==null){if(require)throw new RangeError("Field is not present in this state");return undefined;}ensureAddr(this,addr);return getAddr(this,addr);}/**
      Create a [transaction](https://codemirror.net/6/docs/ref/#state.Transaction) that updates this
      state. Any number of [transaction specs](https://codemirror.net/6/docs/ref/#state.TransactionSpec)
      can be passed. Unless
      [`sequential`](https://codemirror.net/6/docs/ref/#state.TransactionSpec.sequential) is set, the
      [changes](https://codemirror.net/6/docs/ref/#state.TransactionSpec.changes) (if any) of each spec
      are assumed to start in the _current_ document (not the document
      produced by previous specs), and its
      [selection](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection) and
      [effects](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) are assumed to refer
      to the document created by its _own_ changes. The resulting
      transaction contains the combined effect of all the different
      specs. For [selection](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection), later
      specs take precedence over earlier ones.
      */update(...specs){return resolveTransaction(this,specs,true);}/**
      @internal
      */applyTransaction(tr){let conf=this.config,{base,compartments}=conf;for(let effect of tr.effects){if(effect.is(Compartment.reconfigure)){if(conf){compartments=new Map();conf.compartments.forEach((val,key)=>compartments.set(key,val));conf=null;}compartments.set(effect.value.compartment,effect.value.extension);}else if(effect.is(StateEffect.reconfigure)){conf=null;base=effect.value;}else if(effect.is(StateEffect.appendConfig)){conf=null;base=asArray$1(base).concat(effect.value);}}let startValues;if(!conf){conf=Configuration.resolve(base,compartments,this);let intermediateState=new EditorState(conf,this.doc,this.selection,conf.dynamicSlots.map(()=>null),(state,slot)=>slot.reconfigure(state,this),null);startValues=intermediateState.values;}else{startValues=tr.startState.values.slice();}let selection=tr.startState.facet(allowMultipleSelections)?tr.newSelection:tr.newSelection.asSingle();new EditorState(conf,tr.newDoc,selection,startValues,(state,slot)=>slot.update(state,tr),tr);}/**
      Create a [transaction spec](https://codemirror.net/6/docs/ref/#state.TransactionSpec) that
      replaces every selection range with the given content.
      */replaceSelection(text){if(typeof text=="string")text=this.toText(text);return this.changeByRange(range=>({changes:{from:range.from,to:range.to,insert:text},range:EditorSelection.cursor(range.from+text.length)}));}/**
      Create a set of changes and a new selection by running the given
      function for each range in the active selection. The function
      can return an optional set of changes (in the coordinate space
      of the start document), plus an updated range (in the coordinate
      space of the document produced by the call's own changes). This
      method will merge all the changes and ranges into a single
      changeset and selection, and return it as a [transaction
      spec](https://codemirror.net/6/docs/ref/#state.TransactionSpec), which can be passed to
      [`update`](https://codemirror.net/6/docs/ref/#state.EditorState.update).
      */changeByRange(f){let sel=this.selection;let result1=f(sel.ranges[0]);let changes=this.changes(result1.changes),ranges=[result1.range];let effects=asArray$1(result1.effects);for(let i=1;i<sel.ranges.length;i++){let result=f(sel.ranges[i]);let newChanges=this.changes(result.changes),newMapped=newChanges.map(changes);for(let j=0;j<i;j++)ranges[j]=ranges[j].map(newMapped);let mapBy=changes.mapDesc(newChanges,true);ranges.push(result.range.map(mapBy));changes=changes.compose(newMapped);effects=StateEffect.mapEffects(effects,newMapped).concat(StateEffect.mapEffects(asArray$1(result.effects),mapBy));}return{changes,selection:EditorSelection.create(ranges,sel.mainIndex),effects};}/**
      Create a [change set](https://codemirror.net/6/docs/ref/#state.ChangeSet) from the given change
      description, taking the state's document length and line
      separator into account.
      */changes(spec=[]){if(spec instanceof ChangeSet)return spec;return ChangeSet.of(spec,this.doc.length,this.facet(EditorState.lineSeparator));}/**
      Using the state's [line
      separator](https://codemirror.net/6/docs/ref/#state.EditorState^lineSeparator), create a
      [`Text`](https://codemirror.net/6/docs/ref/#state.Text) instance from the given string.
      */toText(string){return Text.of(string.split(this.facet(EditorState.lineSeparator)||DefaultSplit));}/**
      Return the given range of the document as a string.
      */sliceDoc(from=0,to=this.doc.length){return this.doc.sliceString(from,to,this.lineBreak);}/**
      Get the value of a state [facet](https://codemirror.net/6/docs/ref/#state.Facet).
      */facet(facet){let addr=this.config.address[facet.id];if(addr==null)return facet.default;ensureAddr(this,addr);return getAddr(this,addr);}/**
      Convert this state to a JSON-serializable object. When custom
      fields should be serialized, you can pass them in as an object
      mapping property names (in the resulting object, which should
      not use `doc` or `selection`) to fields.
      */toJSON(fields){let result={doc:this.sliceDoc(),selection:this.selection.toJSON()};if(fields)for(let prop in fields){let value=fields[prop];if(value instanceof StateField&&this.config.address[value.id]!=null)result[prop]=value.spec.toJSON(this.field(fields[prop]),this);}return result;}/**
      Deserialize a state from its JSON representation. When custom
      fields should be deserialized, pass the same object you passed
      to [`toJSON`](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON) when serializing as
      third argument.
      */static fromJSON(json,config={},fields){if(!json||typeof json.doc!="string")throw new RangeError("Invalid JSON representation for EditorState");let fieldInit=[];if(fields)for(let prop in fields){if(Object.prototype.hasOwnProperty.call(json,prop)){let field=fields[prop],value=json[prop];fieldInit.push(field.init(state=>field.spec.fromJSON(value,state)));}}return EditorState.create({doc:json.doc,selection:EditorSelection.fromJSON(json.selection),extensions:config.extensions?fieldInit.concat([config.extensions]):fieldInit});}/**
      Create a new state. You'll usually only need this when
      initializing an editor—updated states are created by applying
      transactions.
      */static create(config={}){let configuration=Configuration.resolve(config.extensions||[],new Map());let doc=config.doc instanceof Text?config.doc:Text.of((config.doc||"").split(configuration.staticFacet(EditorState.lineSeparator)||DefaultSplit));let selection=!config.selection?EditorSelection.single(0):config.selection instanceof EditorSelection?config.selection:EditorSelection.single(config.selection.anchor,config.selection.head);checkSelection(selection,doc.length);if(!configuration.staticFacet(allowMultipleSelections))selection=selection.asSingle();return new EditorState(configuration,doc,selection,configuration.dynamicSlots.map(()=>null),(state,slot)=>slot.create(state),null);}/**
      The size (in columns) of a tab in the document, determined by
      the [`tabSize`](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) facet.
      */get tabSize(){return this.facet(EditorState.tabSize);}/**
      Get the proper [line-break](https://codemirror.net/6/docs/ref/#state.EditorState^lineSeparator)
      string for this state.
      */get lineBreak(){return this.facet(EditorState.lineSeparator)||"\n";}/**
      Returns true when the editor is
      [configured](https://codemirror.net/6/docs/ref/#state.EditorState^readOnly) to be read-only.
      */get readOnly(){return this.facet(readOnly);}/**
      Look up a translation for the given phrase (via the
      [`phrases`](https://codemirror.net/6/docs/ref/#state.EditorState^phrases) facet), or return the
      original string if no translation is found.
      
      If additional arguments are passed, they will be inserted in
      place of markers like `$1` (for the first value) and `$2`, etc.
      A single `$` is equivalent to `$1`, and `$$` will produce a
      literal dollar sign.
      */phrase(phrase,...insert){for(let map of this.facet(EditorState.phrases))if(Object.prototype.hasOwnProperty.call(map,phrase)){phrase=map[phrase];break;}if(insert.length)phrase=phrase.replace(/\$(\$|\d*)/g,(m,i)=>{if(i=="$")return"$";let n=+(i||1);return!n||n>insert.length?m:insert[n-1];});return phrase;}/**
      Find the values for a given language data field, provided by the
      the [`languageData`](https://codemirror.net/6/docs/ref/#state.EditorState^languageData) facet.
      
      Examples of language data fields are...
      
      - [`"commentTokens"`](https://codemirror.net/6/docs/ref/#commands.CommentTokens) for specifying
        comment syntax.
      - [`"autocomplete"`](https://codemirror.net/6/docs/ref/#autocomplete.autocompletion^config.override)
        for providing language-specific completion sources.
      - [`"wordChars"`](https://codemirror.net/6/docs/ref/#state.EditorState.charCategorizer) for adding
        characters that should be considered part of words in this
        language.
      - [`"closeBrackets"`](https://codemirror.net/6/docs/ref/#autocomplete.CloseBracketConfig) controls
        bracket closing behavior.
      */languageDataAt(name,pos,side=-1){let values=[];for(let provider of this.facet(languageData)){for(let result of provider(this,pos,side)){if(Object.prototype.hasOwnProperty.call(result,name))values.push(result[name]);}}return values;}/**
      Return a function that can categorize strings (expected to
      represent a single [grapheme cluster](https://codemirror.net/6/docs/ref/#state.findClusterBreak))
      into one of:
      
       - Word (contains an alphanumeric character or a character
         explicitly listed in the local language's `"wordChars"`
         language data, which should be a string)
       - Space (contains only whitespace)
       - Other (anything else)
      */charCategorizer(at){return makeCategorizer(this.languageDataAt("wordChars",at).join(""));}/**
      Find the word at the given position, meaning the range
      containing all [word](https://codemirror.net/6/docs/ref/#state.CharCategory.Word) characters
      around it. If no word characters are adjacent to the position,
      this returns null.
      */wordAt(pos){let{text,from,length}=this.doc.lineAt(pos);let cat=this.charCategorizer(pos);let start=pos-from,end=pos-from;while(start>0){let prev=findClusterBreak(text,start,false);if(cat(text.slice(prev,start))!=CharCategory.Word)break;start=prev;}while(end<length){let next=findClusterBreak(text,end);if(cat(text.slice(end,next))!=CharCategory.Word)break;end=next;}return start==end?null:EditorSelection.range(start+from,end+from);}}/**
  A facet that, when enabled, causes the editor to allow multiple
  ranges to be selected. Be careful though, because by default the
  editor relies on the native DOM selection, which cannot handle
  multiple selections. An extension like
  [`drawSelection`](https://codemirror.net/6/docs/ref/#view.drawSelection) can be used to make
  secondary selections visible to the user.
  */EditorState.allowMultipleSelections=allowMultipleSelections;/**
  Configures the tab size to use in this state. The first
  (highest-precedence) value of the facet is used. If no value is
  given, this defaults to 4.
  */EditorState.tabSize=/*@__PURE__*/Facet.define({combine:values=>values.length?values[0]:4});/**
  The line separator to use. By default, any of `"\n"`, `"\r\n"`
  and `"\r"` is treated as a separator when splitting lines, and
  lines are joined with `"\n"`.

  When you configure a value here, only that precise separator
  will be used, allowing you to round-trip documents through the
  editor without normalizing line separators.
  */EditorState.lineSeparator=lineSeparator;/**
  This facet controls the value of the
  [`readOnly`](https://codemirror.net/6/docs/ref/#state.EditorState.readOnly) getter, which is
  consulted by commands and extensions that implement editing
  functionality to determine whether they should apply. It
  defaults to false, but when its highest-precedence value is
  `true`, such functionality disables itself.

  Not to be confused with
  [`EditorView.editable`](https://codemirror.net/6/docs/ref/#view.EditorView^editable), which
  controls whether the editor's DOM is set to be editable (and
  thus focusable).
  */EditorState.readOnly=readOnly;/**
  Registers translation phrases. The
  [`phrase`](https://codemirror.net/6/docs/ref/#state.EditorState.phrase) method will look through
  all objects registered with this facet to find translations for
  its argument.
  */EditorState.phrases=/*@__PURE__*/Facet.define({compare(a,b){let kA=Object.keys(a),kB=Object.keys(b);return kA.length==kB.length&&kA.every(k=>a[k]==b[k]);}});/**
  A facet used to register [language
  data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) providers.
  */EditorState.languageData=languageData;/**
  Facet used to register change filters, which are called for each
  transaction (unless explicitly
  [disabled](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter)), and can suppress
  part of the transaction's changes.

  Such a function can return `true` to indicate that it doesn't
  want to do anything, `false` to completely stop the changes in
  the transaction, or a set of ranges in which changes should be
  suppressed. Such ranges are represented as an array of numbers,
  with each pair of two numbers indicating the start and end of a
  range. So for example `[10, 20, 100, 110]` suppresses changes
  between 10 and 20, and between 100 and 110.
  */EditorState.changeFilter=changeFilter;/**
  Facet used to register a hook that gets a chance to update or
  replace transaction specs before they are applied. This will
  only be applied for transactions that don't have
  [`filter`](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter) set to `false`. You
  can either return a single transaction spec (possibly the input
  transaction), or an array of specs (which will be combined in
  the same way as the arguments to
  [`EditorState.update`](https://codemirror.net/6/docs/ref/#state.EditorState.update)).

  When possible, it is recommended to avoid accessing
  [`Transaction.state`](https://codemirror.net/6/docs/ref/#state.Transaction.state) in a filter,
  since it will force creation of a state that will then be
  discarded again, if the transaction is actually filtered.

  (This functionality should be used with care. Indiscriminately
  modifying transaction is likely to break something or degrade
  the user experience.)
  */EditorState.transactionFilter=transactionFilter;/**
  This is a more limited form of
  [`transactionFilter`](https://codemirror.net/6/docs/ref/#state.EditorState^transactionFilter),
  which can only add
  [annotations](https://codemirror.net/6/docs/ref/#state.TransactionSpec.annotations) and
  [effects](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects). _But_, this type
  of filter runs even if the transaction has disabled regular
  [filtering](https://codemirror.net/6/docs/ref/#state.TransactionSpec.filter), making it suitable
  for effects that don't need to touch the changes or selection,
  but do want to process every transaction.

  Extenders run _after_ filters, when both are present.
  */EditorState.transactionExtender=transactionExtender;Compartment.reconfigure=/*@__PURE__*/StateEffect.define();/**
  Utility function for combining behaviors to fill in a config
  object from an array of provided configs. `defaults` should hold
  default values for all optional fields in `Config`.

  The function will, by default, error
  when a field gets two values that aren't `===`-equal, but you can
  provide combine functions per field to do something else.
  */function combineConfig(configs,defaults,// Should hold only the optional properties of Config, but I haven't managed to express that
combine={}){let result={};for(let config of configs)for(let key of Object.keys(config)){let value=config[key],current=result[key];if(current===undefined)result[key]=value;else if(current===value||value===undefined);// No conflict
else if(Object.hasOwnProperty.call(combine,key))result[key]=combine[key](current,value);else throw new Error("Config merge conflict for field "+key);}for(let key in defaults)if(result[key]===undefined)result[key]=defaults[key];return result;}/**
  Each range is associated with a value, which must inherit from
  this class.
  */class RangeValue{/**
      Compare this value with another value. Used when comparing
      rangesets. The default implementation compares by identity.
      Unless you are only creating a fixed number of unique instances
      of your value type, it is a good idea to implement this
      properly.
      */eq(other){return this==other;}/**
      Create a [range](https://codemirror.net/6/docs/ref/#state.Range) with this value.
      */range(from,to=from){return Range$1.create(from,to,this);}}RangeValue.prototype.startSide=RangeValue.prototype.endSide=0;RangeValue.prototype.point=false;RangeValue.prototype.mapMode=MapMode.TrackDel;/**
  A range associates a value with a range of positions.
  */let Range$1=class Range{constructor(/**
      The range's start position.
      */from,/**
      Its end position.
      */to,/**
      The value associated with this range.
      */value){this.from=from;this.to=to;this.value=value;}/**
      @internal
      */static create(from,to,value){return new Range(from,to,value);}};function cmpRange(a,b){return a.from-b.from||a.value.startSide-b.value.startSide;}class Chunk{constructor(from,to,value,// Chunks are marked with the largest point that occurs
// in them (or -1 for no points), so that scans that are
// only interested in points (such as the
// heightmap-related logic) can skip range-only chunks.
maxPoint){this.from=from;this.to=to;this.value=value;this.maxPoint=maxPoint;}get length(){return this.to[this.to.length-1];}// Find the index of the given position and side. Use the ranges'
// `from` pos when `end == false`, `to` when `end == true`.
findIndex(pos,side,end,startAt=0){let arr=end?this.to:this.from;for(let lo=startAt,hi=arr.length;;){if(lo==hi)return lo;let mid=lo+hi>>1;let diff=arr[mid]-pos||(end?this.value[mid].endSide:this.value[mid].startSide)-side;if(mid==lo)return diff>=0?lo:hi;if(diff>=0)hi=mid;else lo=mid+1;}}between(offset,from,to,f){for(let i=this.findIndex(from,-1e9/* C.Far */,true),e=this.findIndex(to,1000000000/* C.Far */,false,i);i<e;i++)if(f(this.from[i]+offset,this.to[i]+offset,this.value[i])===false)return false;}map(offset,changes){let value=[],from=[],to=[],newPos=-1,maxPoint=-1;for(let i=0;i<this.value.length;i++){let val=this.value[i],curFrom=this.from[i]+offset,curTo=this.to[i]+offset,newFrom,newTo;if(curFrom==curTo){let mapped=changes.mapPos(curFrom,val.startSide,val.mapMode);if(mapped==null)continue;newFrom=newTo=mapped;if(val.startSide!=val.endSide){newTo=changes.mapPos(curFrom,val.endSide);if(newTo<newFrom)continue;}}else{newFrom=changes.mapPos(curFrom,val.startSide);newTo=changes.mapPos(curTo,val.endSide);if(newFrom>newTo||newFrom==newTo&&val.startSide>0&&val.endSide<=0)continue;}if((newTo-newFrom||val.endSide-val.startSide)<0)continue;if(newPos<0)newPos=newFrom;if(val.point)maxPoint=Math.max(maxPoint,newTo-newFrom);value.push(val);from.push(newFrom-newPos);to.push(newTo-newPos);}return{mapped:value.length?new Chunk(from,to,value,maxPoint):null,pos:newPos};}}/**
  A range set stores a collection of [ranges](https://codemirror.net/6/docs/ref/#state.Range) in a
  way that makes them efficient to [map](https://codemirror.net/6/docs/ref/#state.RangeSet.map) and
  [update](https://codemirror.net/6/docs/ref/#state.RangeSet.update). This is an immutable data
  structure.
  */class RangeSet{constructor(/**
      @internal
      */chunkPos,/**
      @internal
      */chunk,/**
      @internal
      */nextLayer,/**
      @internal
      */maxPoint){this.chunkPos=chunkPos;this.chunk=chunk;this.nextLayer=nextLayer;this.maxPoint=maxPoint;}/**
      @internal
      */static create(chunkPos,chunk,nextLayer,maxPoint){return new RangeSet(chunkPos,chunk,nextLayer,maxPoint);}/**
      @internal
      */get length(){let last=this.chunk.length-1;return last<0?0:Math.max(this.chunkEnd(last),this.nextLayer.length);}/**
      The number of ranges in the set.
      */get size(){if(this.isEmpty)return 0;let size=this.nextLayer.size;for(let chunk of this.chunk)size+=chunk.value.length;return size;}/**
      @internal
      */chunkEnd(index){return this.chunkPos[index]+this.chunk[index].length;}/**
      Update the range set, optionally adding new ranges or filtering
      out existing ones.
      
      (Note: The type parameter is just there as a kludge to work
      around TypeScript variance issues that prevented `RangeSet<X>`
      from being a subtype of `RangeSet<Y>` when `X` is a subtype of
      `Y`.)
      */update(updateSpec){let{add=[],sort=false,filterFrom=0,filterTo=this.length}=updateSpec;let filter=updateSpec.filter;if(add.length==0&&!filter)return this;if(sort)add=add.slice().sort(cmpRange);if(this.isEmpty)return add.length?RangeSet.of(add):this;let cur=new LayerCursor(this,null,-1).goto(0),i=0,spill=[];let builder=new RangeSetBuilder();while(cur.value||i<add.length){if(i<add.length&&(cur.from-add[i].from||cur.startSide-add[i].value.startSide)>=0){let range=add[i++];if(!builder.addInner(range.from,range.to,range.value))spill.push(range);}else if(cur.rangeIndex==1&&cur.chunkIndex<this.chunk.length&&(i==add.length||this.chunkEnd(cur.chunkIndex)<add[i].from)&&(!filter||filterFrom>this.chunkEnd(cur.chunkIndex)||filterTo<this.chunkPos[cur.chunkIndex])&&builder.addChunk(this.chunkPos[cur.chunkIndex],this.chunk[cur.chunkIndex])){cur.nextChunk();}else{if(!filter||filterFrom>cur.to||filterTo<cur.from||filter(cur.from,cur.to,cur.value)){if(!builder.addInner(cur.from,cur.to,cur.value))spill.push(Range$1.create(cur.from,cur.to,cur.value));}cur.next();}}return builder.finishInner(this.nextLayer.isEmpty&&!spill.length?RangeSet.empty:this.nextLayer.update({add:spill,filter,filterFrom,filterTo}));}/**
      Map this range set through a set of changes, return the new set.
      */map(changes){if(changes.empty||this.isEmpty)return this;let chunks=[],chunkPos=[],maxPoint=-1;for(let i=0;i<this.chunk.length;i++){let start=this.chunkPos[i],chunk=this.chunk[i];let touch=changes.touchesRange(start,start+chunk.length);if(touch===false){maxPoint=Math.max(maxPoint,chunk.maxPoint);chunks.push(chunk);chunkPos.push(changes.mapPos(start));}else if(touch===true){let{mapped,pos}=chunk.map(start,changes);if(mapped){maxPoint=Math.max(maxPoint,mapped.maxPoint);chunks.push(mapped);chunkPos.push(pos);}}}let next=this.nextLayer.map(changes);return chunks.length==0?next:new RangeSet(chunkPos,chunks,next||RangeSet.empty,maxPoint);}/**
      Iterate over the ranges that touch the region `from` to `to`,
      calling `f` for each. There is no guarantee that the ranges will
      be reported in any specific order. When the callback returns
      `false`, iteration stops.
      */between(from,to,f){if(this.isEmpty)return;for(let i=0;i<this.chunk.length;i++){let start=this.chunkPos[i],chunk=this.chunk[i];if(to>=start&&from<=start+chunk.length&&chunk.between(start,from-start,to-start,f)===false)return;}this.nextLayer.between(from,to,f);}/**
      Iterate over the ranges in this set, in order, including all
      ranges that end at or after `from`.
      */iter(from=0){return HeapCursor.from([this]).goto(from);}/**
      @internal
      */get isEmpty(){return this.nextLayer==this;}/**
      Iterate over the ranges in a collection of sets, in order,
      starting from `from`.
      */static iter(sets,from=0){return HeapCursor.from(sets).goto(from);}/**
      Iterate over two groups of sets, calling methods on `comparator`
      to notify it of possible differences.
      */static compare(oldSets,newSets,/**
      This indicates how the underlying data changed between these
      ranges, and is needed to synchronize the iteration.
      */textDiff,comparator,/**
      Can be used to ignore all non-point ranges, and points below
      the given size. When -1, all ranges are compared.
      */minPointSize=-1){let a=oldSets.filter(set=>set.maxPoint>0||!set.isEmpty&&set.maxPoint>=minPointSize);let b=newSets.filter(set=>set.maxPoint>0||!set.isEmpty&&set.maxPoint>=minPointSize);let sharedChunks=findSharedChunks(a,b,textDiff);let sideA=new SpanCursor(a,sharedChunks,minPointSize);let sideB=new SpanCursor(b,sharedChunks,minPointSize);textDiff.iterGaps((fromA,fromB,length)=>compare(sideA,fromA,sideB,fromB,length,comparator));if(textDiff.empty&&textDiff.length==0)compare(sideA,0,sideB,0,0,comparator);}/**
      Compare the contents of two groups of range sets, returning true
      if they are equivalent in the given range.
      */static eq(oldSets,newSets,from=0,to){if(to==null)to=1000000000/* C.Far */-1;let a=oldSets.filter(set=>!set.isEmpty&&newSets.indexOf(set)<0);let b=newSets.filter(set=>!set.isEmpty&&oldSets.indexOf(set)<0);if(a.length!=b.length)return false;if(!a.length)return true;let sharedChunks=findSharedChunks(a,b);let sideA=new SpanCursor(a,sharedChunks,0).goto(from),sideB=new SpanCursor(b,sharedChunks,0).goto(from);for(;;){if(sideA.to!=sideB.to||!sameValues(sideA.active,sideB.active)||sideA.point&&(!sideB.point||!sideA.point.eq(sideB.point)))return false;if(sideA.to>to)return true;sideA.next();sideB.next();}}/**
      Iterate over a group of range sets at the same time, notifying
      the iterator about the ranges covering every given piece of
      content. Returns the open count (see
      [`SpanIterator.span`](https://codemirror.net/6/docs/ref/#state.SpanIterator.span)) at the end
      of the iteration.
      */static spans(sets,from,to,iterator,/**
      When given and greater than -1, only points of at least this
      size are taken into account.
      */minPointSize=-1){let cursor=new SpanCursor(sets,null,minPointSize).goto(from),pos=from;let openRanges=cursor.openStart;for(;;){let curTo=Math.min(cursor.to,to);if(cursor.point){let active=cursor.activeForPoint(cursor.to);let openCount=cursor.pointFrom<from?active.length+1:cursor.point.startSide<0?active.length:Math.min(active.length,openRanges);iterator.point(pos,curTo,cursor.point,active,openCount,cursor.pointRank);openRanges=Math.min(cursor.openEnd(curTo),active.length);}else if(curTo>pos){iterator.span(pos,curTo,cursor.active,openRanges);openRanges=cursor.openEnd(curTo);}if(cursor.to>to)return openRanges+(cursor.point&&cursor.to>to?1:0);pos=cursor.to;cursor.next();}}/**
      Create a range set for the given range or array of ranges. By
      default, this expects the ranges to be _sorted_ (by start
      position and, if two start at the same position,
      `value.startSide`). You can pass `true` as second argument to
      cause the method to sort them.
      */static of(ranges,sort=false){let build=new RangeSetBuilder();for(let range of ranges instanceof Range$1?[ranges]:sort?lazySort(ranges):ranges)build.add(range.from,range.to,range.value);return build.finish();}/**
      Join an array of range sets into a single set.
      */static join(sets){if(!sets.length)return RangeSet.empty;let result=sets[sets.length-1];for(let i=sets.length-2;i>=0;i--){for(let layer=sets[i];layer!=RangeSet.empty;layer=layer.nextLayer)result=new RangeSet(layer.chunkPos,layer.chunk,result,Math.max(layer.maxPoint,result.maxPoint));}return result;}}/**
  The empty set of ranges.
  */RangeSet.empty=/*@__PURE__*/new RangeSet([],[],null,-1);function lazySort(ranges){if(ranges.length>1)for(let prev=ranges[0],i=1;i<ranges.length;i++){let cur=ranges[i];if(cmpRange(prev,cur)>0)return ranges.slice().sort(cmpRange);prev=cur;}return ranges;}RangeSet.empty.nextLayer=RangeSet.empty;/**
  A range set builder is a data structure that helps build up a
  [range set](https://codemirror.net/6/docs/ref/#state.RangeSet) directly, without first allocating
  an array of [`Range`](https://codemirror.net/6/docs/ref/#state.Range) objects.
  */class RangeSetBuilder{finishChunk(newArrays){this.chunks.push(new Chunk(this.from,this.to,this.value,this.maxPoint));this.chunkPos.push(this.chunkStart);this.chunkStart=-1;this.setMaxPoint=Math.max(this.setMaxPoint,this.maxPoint);this.maxPoint=-1;if(newArrays){this.from=[];this.to=[];this.value=[];}}/**
      Create an empty builder.
      */constructor(){this.chunks=[];this.chunkPos=[];this.chunkStart=-1;this.last=null;this.lastFrom=-1e9/* C.Far */;this.lastTo=-1e9/* C.Far */;this.from=[];this.to=[];this.value=[];this.maxPoint=-1;this.setMaxPoint=-1;this.nextLayer=null;}/**
      Add a range. Ranges should be added in sorted (by `from` and
      `value.startSide`) order.
      */add(from,to,value){if(!this.addInner(from,to,value))(this.nextLayer||(this.nextLayer=new RangeSetBuilder())).add(from,to,value);}/**
      @internal
      */addInner(from,to,value){let diff=from-this.lastTo||value.startSide-this.last.endSide;if(diff<=0&&(from-this.lastFrom||value.startSide-this.last.startSide)<0)throw new Error("Ranges must be added sorted by `from` position and `startSide`");if(diff<0)return false;if(this.from.length==250/* C.ChunkSize */)this.finishChunk(true);if(this.chunkStart<0)this.chunkStart=from;this.from.push(from-this.chunkStart);this.to.push(to-this.chunkStart);this.last=value;this.lastFrom=from;this.lastTo=to;this.value.push(value);if(value.point)this.maxPoint=Math.max(this.maxPoint,to-from);return true;}/**
      @internal
      */addChunk(from,chunk){if((from-this.lastTo||chunk.value[0].startSide-this.last.endSide)<0)return false;if(this.from.length)this.finishChunk(true);this.setMaxPoint=Math.max(this.setMaxPoint,chunk.maxPoint);this.chunks.push(chunk);this.chunkPos.push(from);let last=chunk.value.length-1;this.last=chunk.value[last];this.lastFrom=chunk.from[last]+from;this.lastTo=chunk.to[last]+from;return true;}/**
      Finish the range set. Returns the new set. The builder can't be
      used anymore after this has been called.
      */finish(){return this.finishInner(RangeSet.empty);}/**
      @internal
      */finishInner(next){if(this.from.length)this.finishChunk(false);if(this.chunks.length==0)return next;let result=RangeSet.create(this.chunkPos,this.chunks,this.nextLayer?this.nextLayer.finishInner(next):next,this.setMaxPoint);this.from=null;// Make sure further `add` calls produce errors
return result;}}function findSharedChunks(a,b,textDiff){let inA=new Map();for(let set of a)for(let i=0;i<set.chunk.length;i++)if(set.chunk[i].maxPoint<=0)inA.set(set.chunk[i],set.chunkPos[i]);let shared=new Set();for(let set of b)for(let i=0;i<set.chunk.length;i++){let known=inA.get(set.chunk[i]);if(known!=null&&(textDiff?textDiff.mapPos(known):known)==set.chunkPos[i]&&!(textDiff===null||textDiff===void 0?void 0:textDiff.touchesRange(known,known+set.chunk[i].length)))shared.add(set.chunk[i]);}return shared;}class LayerCursor{constructor(layer,skip,minPoint,rank=0){this.layer=layer;this.skip=skip;this.minPoint=minPoint;this.rank=rank;}get startSide(){return this.value?this.value.startSide:0;}get endSide(){return this.value?this.value.endSide:0;}goto(pos,side=-1e9/* C.Far */){this.chunkIndex=this.rangeIndex=0;this.gotoInner(pos,side,false);return this;}gotoInner(pos,side,forward){while(this.chunkIndex<this.layer.chunk.length){let next=this.layer.chunk[this.chunkIndex];if(!(this.skip&&this.skip.has(next)||this.layer.chunkEnd(this.chunkIndex)<pos||next.maxPoint<this.minPoint))break;this.chunkIndex++;forward=false;}if(this.chunkIndex<this.layer.chunk.length){let rangeIndex=this.layer.chunk[this.chunkIndex].findIndex(pos-this.layer.chunkPos[this.chunkIndex],side,true);if(!forward||this.rangeIndex<rangeIndex)this.setRangeIndex(rangeIndex);}this.next();}forward(pos,side){if((this.to-pos||this.endSide-side)<0)this.gotoInner(pos,side,true);}next(){for(;;){if(this.chunkIndex==this.layer.chunk.length){this.from=this.to=1000000000/* C.Far */;this.value=null;break;}else{let chunkPos=this.layer.chunkPos[this.chunkIndex],chunk=this.layer.chunk[this.chunkIndex];let from=chunkPos+chunk.from[this.rangeIndex];this.from=from;this.to=chunkPos+chunk.to[this.rangeIndex];this.value=chunk.value[this.rangeIndex];this.setRangeIndex(this.rangeIndex+1);if(this.minPoint<0||this.value.point&&this.to-this.from>=this.minPoint)break;}}}setRangeIndex(index){if(index==this.layer.chunk[this.chunkIndex].value.length){this.chunkIndex++;if(this.skip){while(this.chunkIndex<this.layer.chunk.length&&this.skip.has(this.layer.chunk[this.chunkIndex]))this.chunkIndex++;}this.rangeIndex=0;}else{this.rangeIndex=index;}}nextChunk(){this.chunkIndex++;this.rangeIndex=0;this.next();}compare(other){return this.from-other.from||this.startSide-other.startSide||this.rank-other.rank||this.to-other.to||this.endSide-other.endSide;}}class HeapCursor{constructor(heap){this.heap=heap;}static from(sets,skip=null,minPoint=-1){let heap=[];for(let i=0;i<sets.length;i++){for(let cur=sets[i];!cur.isEmpty;cur=cur.nextLayer){if(cur.maxPoint>=minPoint)heap.push(new LayerCursor(cur,skip,minPoint,i));}}return heap.length==1?heap[0]:new HeapCursor(heap);}get startSide(){return this.value?this.value.startSide:0;}goto(pos,side=-1e9/* C.Far */){for(let cur of this.heap)cur.goto(pos,side);for(let i=this.heap.length>>1;i>=0;i--)heapBubble(this.heap,i);this.next();return this;}forward(pos,side){for(let cur of this.heap)cur.forward(pos,side);for(let i=this.heap.length>>1;i>=0;i--)heapBubble(this.heap,i);if((this.to-pos||this.value.endSide-side)<0)this.next();}next(){if(this.heap.length==0){this.from=this.to=1000000000/* C.Far */;this.value=null;this.rank=-1;}else{let top=this.heap[0];this.from=top.from;this.to=top.to;this.value=top.value;this.rank=top.rank;if(top.value)top.next();heapBubble(this.heap,0);}}}function heapBubble(heap,index){for(let cur=heap[index];;){let childIndex=(index<<1)+1;if(childIndex>=heap.length)break;let child=heap[childIndex];if(childIndex+1<heap.length&&child.compare(heap[childIndex+1])>=0){child=heap[childIndex+1];childIndex++;}if(cur.compare(child)<0)break;heap[childIndex]=cur;heap[index]=child;index=childIndex;}}class SpanCursor{constructor(sets,skip,minPoint){this.minPoint=minPoint;this.active=[];this.activeTo=[];this.activeRank=[];this.minActive=-1;// A currently active point range, if any
this.point=null;this.pointFrom=0;this.pointRank=0;this.to=-1e9/* C.Far */;this.endSide=0;// The amount of open active ranges at the start of the iterator.
// Not including points.
this.openStart=-1;this.cursor=HeapCursor.from(sets,skip,minPoint);}goto(pos,side=-1e9/* C.Far */){this.cursor.goto(pos,side);this.active.length=this.activeTo.length=this.activeRank.length=0;this.minActive=-1;this.to=pos;this.endSide=side;this.openStart=-1;this.next();return this;}forward(pos,side){while(this.minActive>-1&&(this.activeTo[this.minActive]-pos||this.active[this.minActive].endSide-side)<0)this.removeActive(this.minActive);this.cursor.forward(pos,side);}removeActive(index){remove(this.active,index);remove(this.activeTo,index);remove(this.activeRank,index);this.minActive=findMinIndex(this.active,this.activeTo);}addActive(trackOpen){let i=0,{value,to,rank}=this.cursor;// Organize active marks by rank first, then by size
while(i<this.activeRank.length&&(rank-this.activeRank[i]||to-this.activeTo[i])>0)i++;insert(this.active,i,value);insert(this.activeTo,i,to);insert(this.activeRank,i,rank);if(trackOpen)insert(trackOpen,i,this.cursor.from);this.minActive=findMinIndex(this.active,this.activeTo);}// After calling this, if `this.point` != null, the next range is a
// point. Otherwise, it's a regular range, covered by `this.active`.
next(){let from=this.to,wasPoint=this.point;this.point=null;let trackOpen=this.openStart<0?[]:null;for(;;){let a=this.minActive;if(a>-1&&(this.activeTo[a]-this.cursor.from||this.active[a].endSide-this.cursor.startSide)<0){if(this.activeTo[a]>from){this.to=this.activeTo[a];this.endSide=this.active[a].endSide;break;}this.removeActive(a);if(trackOpen)remove(trackOpen,a);}else if(!this.cursor.value){this.to=this.endSide=1000000000/* C.Far */;break;}else if(this.cursor.from>from){this.to=this.cursor.from;this.endSide=this.cursor.startSide;break;}else{let nextVal=this.cursor.value;if(!nextVal.point){// Opening a range
this.addActive(trackOpen);this.cursor.next();}else if(wasPoint&&this.cursor.to==this.to&&this.cursor.from<this.cursor.to){// Ignore any non-empty points that end precisely at the end of the prev point
this.cursor.next();}else{// New point
this.point=nextVal;this.pointFrom=this.cursor.from;this.pointRank=this.cursor.rank;this.to=this.cursor.to;this.endSide=nextVal.endSide;this.cursor.next();this.forward(this.to,this.endSide);break;}}}if(trackOpen){this.openStart=0;for(let i=trackOpen.length-1;i>=0&&trackOpen[i]<from;i--)this.openStart++;}}activeForPoint(to){if(!this.active.length)return this.active;let active=[];for(let i=this.active.length-1;i>=0;i--){if(this.activeRank[i]<this.pointRank)break;if(this.activeTo[i]>to||this.activeTo[i]==to&&this.active[i].endSide>=this.point.endSide)active.push(this.active[i]);}return active.reverse();}openEnd(to){let open=0;for(let i=this.activeTo.length-1;i>=0&&this.activeTo[i]>to;i--)open++;return open;}}function compare(a,startA,b,startB,length,comparator){a.goto(startA);b.goto(startB);let endB=startB+length;let pos=startB,dPos=startB-startA;for(;;){let diff=a.to+dPos-b.to||a.endSide-b.endSide;let end=diff<0?a.to+dPos:b.to,clipEnd=Math.min(end,endB);if(a.point||b.point){if(!(a.point&&b.point&&(a.point==b.point||a.point.eq(b.point))&&sameValues(a.activeForPoint(a.to),b.activeForPoint(b.to))))comparator.comparePoint(pos,clipEnd,a.point,b.point);}else{if(clipEnd>pos&&!sameValues(a.active,b.active))comparator.compareRange(pos,clipEnd,a.active,b.active);}if(end>endB)break;pos=end;if(diff<=0)a.next();if(diff>=0)b.next();}}function sameValues(a,b){if(a.length!=b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!=b[i]&&!a[i].eq(b[i]))return false;return true;}function remove(array,index){for(let i=index,e=array.length-1;i<e;i++)array[i]=array[i+1];array.pop();}function insert(array,index,value){for(let i=array.length-1;i>=index;i--)array[i+1]=array[i];array[index]=value;}function findMinIndex(value,array){let found=-1,foundPos=1000000000/* C.Far */;for(let i=0;i<array.length;i++)if((array[i]-foundPos||value[i].endSide-value[found].endSide)<0){found=i;foundPos=array[i];}return found;}/**
  Count the column position at the given offset into the string,
  taking extending characters and tab size into account.
  */function countColumn(string,tabSize,to=string.length){let n=0;for(let i=0;i<to;){if(string.charCodeAt(i)==9){n+=tabSize-n%tabSize;i++;}else{n++;i=findClusterBreak(string,i);}}return n;}/**
  Find the offset that corresponds to the given column position in a
  string, taking extending characters and tab size into account. By
  default, the string length is returned when it is too short to
  reach the column. Pass `strict` true to make it return -1 in that
  situation.
  */function findColumn(string,col,tabSize,strict){for(let i=0,n=0;;){if(n>=col)return i;if(i==string.length)break;n+=string.charCodeAt(i)==9?tabSize-n%tabSize:1;i=findClusterBreak(string,i);}return strict===true?-1:string.length;}const C="\u037c";const COUNT=typeof Symbol=="undefined"?"__"+C:Symbol.for(C);const SET=typeof Symbol=="undefined"?"__styleSet"+Math.floor(Math.random()*1e8):Symbol("styleSet");const top=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:{};// :: - Style modules encapsulate a set of CSS rules defined from
// JavaScript. Their definitions are only available in a given DOM
// root after it has been _mounted_ there with `StyleModule.mount`.
//
// Style modules should be created once and stored somewhere, as
// opposed to re-creating them every time you need them. The amount of
// CSS rules generated for a given DOM root is bounded by the amount
// of style modules that were used. So to avoid leaking rules, don't
// create these dynamically, but treat them as one-time allocations.
class StyleModule{// :: (Object<Style>, ?{finish: ?(string) → string})
// Create a style module from the given spec.
//
// When `finish` is given, it is called on regular (non-`@`)
// selectors (after `&` expansion) to compute the final selector.
constructor(spec,options){this.rules=[];let{finish}=options||{};function splitSelector(selector){return /^@/.test(selector)?[selector]:selector.split(/,\s*/);}function render(selectors,spec,target,isKeyframes){let local=[],isAt=/^@(\w+)\b/.exec(selectors[0]),keyframes=isAt&&isAt[1]=="keyframes";if(isAt&&spec==null)return target.push(selectors[0]+";");for(let prop in spec){let value=spec[prop];if(/&/.test(prop)){render(prop.split(/,\s*/).map(part=>selectors.map(sel=>part.replace(/&/,sel))).reduce((a,b)=>a.concat(b)),value,target);}else if(value&&typeof value=="object"){if(!isAt)throw new RangeError("The value of a property ("+prop+") should be a primitive value.");render(splitSelector(prop),value,local,keyframes);}else if(value!=null){local.push(prop.replace(/_.*/,"").replace(/[A-Z]/g,l=>"-"+l.toLowerCase())+": "+value+";");}}if(local.length||keyframes){target.push((finish&&!isAt&&!isKeyframes?selectors.map(finish):selectors).join(", ")+" {"+local.join(" ")+"}");}}for(let prop in spec)render(splitSelector(prop),spec[prop],this.rules);}// :: () → string
// Returns a string containing the module's CSS rules.
getRules(){return this.rules.join("\n");}// :: () → string
// Generate a new unique CSS class name.
static newName(){let id=top[COUNT]||1;top[COUNT]=id+1;return C+id.toString(36);}// :: (union<Document, ShadowRoot>, union<[StyleModule], StyleModule>, ?{nonce: ?string})
//
// Mount the given set of modules in the given DOM root, which ensures
// that the CSS rules defined by the module are available in that
// context.
//
// Rules are only added to the document once per root.
//
// Rule order will follow the order of the modules, so that rules from
// modules later in the array take precedence of those from earlier
// modules. If you call this function multiple times for the same root
// in a way that changes the order of already mounted modules, the old
// order will be changed.
//
// If a Content Security Policy nonce is provided, it is added to
// the `<style>` tag generated by the library.
static mount(root,modules,options){let set=root[SET],nonce=options&&options.nonce;if(!set)set=new StyleSet(root,nonce);else if(nonce)set.setNonce(nonce);set.mount(Array.isArray(modules)?modules:[modules],root);}}let adoptedSet=new Map();//<Document, StyleSet>
class StyleSet{constructor(root,nonce){let doc=root.ownerDocument||root,win=doc.defaultView;if(!root.head&&root.adoptedStyleSheets&&win.CSSStyleSheet){let adopted=adoptedSet.get(doc);if(adopted)return root[SET]=adopted;this.sheet=new win.CSSStyleSheet();adoptedSet.set(doc,this);}else{this.styleTag=doc.createElement("style");if(nonce)this.styleTag.setAttribute("nonce",nonce);}this.modules=[];root[SET]=this;}mount(modules,root){let sheet=this.sheet;let pos=0/* Current rule offset */,j=0;/* Index into this.modules */for(let i=0;i<modules.length;i++){let mod=modules[i],index=this.modules.indexOf(mod);if(index<j&&index>-1){// Ordering conflict
this.modules.splice(index,1);j--;index=-1;}if(index==-1){this.modules.splice(j++,0,mod);if(sheet)for(let k=0;k<mod.rules.length;k++)sheet.insertRule(mod.rules[k],pos++);}else{while(j<index)pos+=this.modules[j++].rules.length;pos+=mod.rules.length;j++;}}if(sheet){if(root.adoptedStyleSheets.indexOf(this.sheet)<0)root.adoptedStyleSheets=[this.sheet,...root.adoptedStyleSheets];}else{let text="";for(let i=0;i<this.modules.length;i++)text+=this.modules[i].getRules()+"\n";this.styleTag.textContent=text;let target=root.head||root;if(this.styleTag.parentNode!=target)target.insertBefore(this.styleTag,target.firstChild);}}setNonce(nonce){if(this.styleTag&&this.styleTag.getAttribute("nonce")!=nonce)this.styleTag.setAttribute("nonce",nonce);}}// Style::Object<union<Style,string>>
//
// A style is an object that, in the simple case, maps CSS property
// names to strings holding their values, as in `{color: "red",
// fontWeight: "bold"}`. The property names can be given in
// camel-case—the library will insert a dash before capital letters
// when converting them to CSS.
//
// If you include an underscore in a property name, it and everything
// after it will be removed from the output, which can be useful when
// providing a property multiple times, for browser compatibility
// reasons.
//
// A property in a style object can also be a sub-selector, which
// extends the current context to add a pseudo-selector or a child
// selector. Such a property should contain a `&` character, which
// will be replaced by the current selector. For example `{"&:before":
// {content: '"hi"'}}`. Sub-selectors and regular properties can
// freely be mixed in a given object. Any property containing a `&` is
// assumed to be a sub-selector.
//
// Finally, a property can specify an @-block to be wrapped around the
// styles defined inside the object that's the property's value. For
// example to create a media query you can do `{"@media screen and
// (min-width: 400px)": {...}}`.
var base={8:"Backspace",9:"Tab",10:"Enter",12:"NumLock",13:"Enter",16:"Shift",17:"Control",18:"Alt",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",44:"PrintScreen",45:"Insert",46:"Delete",59:";",61:"=",91:"Meta",92:"Meta",106:"*",107:"+",108:",",109:"-",110:".",111:"/",144:"NumLock",145:"ScrollLock",160:"Shift",161:"Shift",162:"Control",163:"Control",164:"Alt",165:"Alt",173:"-",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'"};var shift={48:")",49:"!",50:"@",51:"#",52:"$",53:"%",54:"^",55:"&",56:"*",57:"(",59:":",61:"+",173:"_",186:":",187:"+",188:"<",189:"_",190:">",191:"?",192:"~",219:"{",220:"|",221:"}",222:"\""};var mac=typeof navigator!="undefined"&&/Mac/.test(navigator.platform);var ie$1=typeof navigator!="undefined"&&/MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);// Fill in the digit keys
for(var i=0;i<10;i++)base[48+i]=base[96+i]=String(i);// The function keys
for(var i=1;i<=24;i++)base[i+111]="F"+i;// And the alphabetic keys
for(var i=65;i<=90;i++){base[i]=String.fromCharCode(i+32);shift[i]=String.fromCharCode(i);}// For each code that doesn't have a shift-equivalent, copy the base name
for(var code in base)if(!shift.hasOwnProperty(code))shift[code]=base[code];function keyName(event){// On macOS, keys held with Shift and Cmd don't reflect the effect of Shift in `.key`.
// On IE, shift effect is never included in `.key`.
var ignoreKey=mac&&event.metaKey&&event.shiftKey&&!event.ctrlKey&&!event.altKey||ie$1&&event.shiftKey&&event.key&&event.key.length==1||event.key=="Unidentified";var name=!ignoreKey&&event.key||(event.shiftKey?shift:base)[event.keyCode]||event.key||"Unidentified";// Edge sometimes produces wrong names (Issue #3)
if(name=="Esc")name="Escape";if(name=="Del")name="Delete";// https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8860571/
if(name=="Left")name="ArrowLeft";if(name=="Up")name="ArrowUp";if(name=="Right")name="ArrowRight";if(name=="Down")name="ArrowDown";return name;}function getSelection(root){let target;// Browsers differ on whether shadow roots have a getSelection
// method. If it exists, use that, otherwise, call it on the
// document.
if(root.nodeType==11){// Shadow root
target=root.getSelection?root:root.ownerDocument;}else{target=root;}return target.getSelection();}function contains(dom,node){return node?dom==node||dom.contains(node.nodeType!=1?node.parentNode:node):false;}function deepActiveElement(doc){let elt=doc.activeElement;while(elt&&elt.shadowRoot)elt=elt.shadowRoot.activeElement;return elt;}function hasSelection(dom,selection){if(!selection.anchorNode)return false;try{// Firefox will raise 'permission denied' errors when accessing
// properties of `sel.anchorNode` when it's in a generated CSS
// element.
return contains(dom,selection.anchorNode);}catch(_){return false;}}function clientRectsFor(dom){if(dom.nodeType==3)return textRange(dom,0,dom.nodeValue.length).getClientRects();else if(dom.nodeType==1)return dom.getClientRects();else return[];}// Scans forward and backward through DOM positions equivalent to the
// given one to see if the two are in the same place (i.e. after a
// text node vs at the end of that text node)
function isEquivalentPosition(node,off,targetNode,targetOff){return targetNode?scanFor(node,off,targetNode,targetOff,-1)||scanFor(node,off,targetNode,targetOff,1):false;}function domIndex(node){for(var index=0;;index++){node=node.previousSibling;if(!node)return index;}}function scanFor(node,off,targetNode,targetOff,dir){for(;;){if(node==targetNode&&off==targetOff)return true;if(off==(dir<0?0:maxOffset(node))){if(node.nodeName=="DIV")return false;let parent=node.parentNode;if(!parent||parent.nodeType!=1)return false;off=domIndex(node)+(dir<0?0:1);node=parent;}else if(node.nodeType==1){node=node.childNodes[off+(dir<0?-1:0)];if(node.nodeType==1&&node.contentEditable=="false")return false;off=dir<0?maxOffset(node):0;}else{return false;}}}function maxOffset(node){return node.nodeType==3?node.nodeValue.length:node.childNodes.length;}function flattenRect(rect,left){let x=left?rect.left:rect.right;return{left:x,right:x,top:rect.top,bottom:rect.bottom};}function windowRect(win){return{left:0,right:win.innerWidth,top:0,bottom:win.innerHeight};}function getScale(elt,rect){let scaleX=rect.width/elt.offsetWidth;let scaleY=rect.height/elt.offsetHeight;if(scaleX>0.995&&scaleX<1.005||!isFinite(scaleX)||Math.abs(rect.width-elt.offsetWidth)<1)scaleX=1;if(scaleY>0.995&&scaleY<1.005||!isFinite(scaleY)||Math.abs(rect.height-elt.offsetHeight)<1)scaleY=1;return{scaleX,scaleY};}function scrollRectIntoView(dom,rect,side,x,y,xMargin,yMargin,ltr){let doc=dom.ownerDocument,win=doc.defaultView||window;for(let cur=dom,stop=false;cur&&!stop;){if(cur.nodeType==1){// Element
let bounding,top=cur==doc.body;let scaleX=1,scaleY=1;if(top){bounding=windowRect(win);}else{if(/^(fixed|sticky)$/.test(getComputedStyle(cur).position))stop=true;if(cur.scrollHeight<=cur.clientHeight&&cur.scrollWidth<=cur.clientWidth){cur=cur.assignedSlot||cur.parentNode;continue;}let rect=cur.getBoundingClientRect();({scaleX,scaleY}=getScale(cur,rect));// Make sure scrollbar width isn't included in the rectangle
bounding={left:rect.left,right:rect.left+cur.clientWidth*scaleX,top:rect.top,bottom:rect.top+cur.clientHeight*scaleY};}let moveX=0,moveY=0;if(y=="nearest"){if(rect.top<bounding.top){moveY=-(bounding.top-rect.top+yMargin);if(side>0&&rect.bottom>bounding.bottom+moveY)moveY=rect.bottom-bounding.bottom+moveY+yMargin;}else if(rect.bottom>bounding.bottom){moveY=rect.bottom-bounding.bottom+yMargin;if(side<0&&rect.top-moveY<bounding.top)moveY=-(bounding.top+moveY-rect.top+yMargin);}}else{let rectHeight=rect.bottom-rect.top,boundingHeight=bounding.bottom-bounding.top;let targetTop=y=="center"&&rectHeight<=boundingHeight?rect.top+rectHeight/2-boundingHeight/2:y=="start"||y=="center"&&side<0?rect.top-yMargin:rect.bottom-boundingHeight+yMargin;moveY=targetTop-bounding.top;}if(x=="nearest"){if(rect.left<bounding.left){moveX=-(bounding.left-rect.left+xMargin);if(side>0&&rect.right>bounding.right+moveX)moveX=rect.right-bounding.right+moveX+xMargin;}else if(rect.right>bounding.right){moveX=rect.right-bounding.right+xMargin;if(side<0&&rect.left<bounding.left+moveX)moveX=-(bounding.left+moveX-rect.left+xMargin);}}else{let targetLeft=x=="center"?rect.left+(rect.right-rect.left)/2-(bounding.right-bounding.left)/2:x=="start"==ltr?rect.left-xMargin:rect.right-(bounding.right-bounding.left)+xMargin;moveX=targetLeft-bounding.left;}if(moveX||moveY){if(top){win.scrollBy(moveX,moveY);}else{let movedX=0,movedY=0;if(moveY){let start=cur.scrollTop;cur.scrollTop+=moveY/scaleY;movedY=(cur.scrollTop-start)*scaleY;}if(moveX){let start=cur.scrollLeft;cur.scrollLeft+=moveX/scaleX;movedX=(cur.scrollLeft-start)*scaleX;}rect={left:rect.left-movedX,top:rect.top-movedY,right:rect.right-movedX,bottom:rect.bottom-movedY};if(movedX&&Math.abs(movedX-moveX)<1)x="nearest";if(movedY&&Math.abs(movedY-moveY)<1)y="nearest";}}if(top)break;cur=cur.assignedSlot||cur.parentNode;}else if(cur.nodeType==11){// A shadow root
cur=cur.host;}else{break;}}}function scrollableParent(dom){let doc=dom.ownerDocument;for(let cur=dom.parentNode;cur;){if(cur==doc.body){break;}else if(cur.nodeType==1){if(cur.scrollHeight>cur.clientHeight||cur.scrollWidth>cur.clientWidth)return cur;cur=cur.assignedSlot||cur.parentNode;}else if(cur.nodeType==11){cur=cur.host;}else{break;}}return null;}class DOMSelectionState{constructor(){this.anchorNode=null;this.anchorOffset=0;this.focusNode=null;this.focusOffset=0;}eq(domSel){return this.anchorNode==domSel.anchorNode&&this.anchorOffset==domSel.anchorOffset&&this.focusNode==domSel.focusNode&&this.focusOffset==domSel.focusOffset;}setRange(range){let{anchorNode,focusNode}=range;// Clip offsets to node size to avoid crashes when Safari reports bogus offsets (#1152)
this.set(anchorNode,Math.min(range.anchorOffset,anchorNode?maxOffset(anchorNode):0),focusNode,Math.min(range.focusOffset,focusNode?maxOffset(focusNode):0));}set(anchorNode,anchorOffset,focusNode,focusOffset){this.anchorNode=anchorNode;this.anchorOffset=anchorOffset;this.focusNode=focusNode;this.focusOffset=focusOffset;}}let preventScrollSupported=null;// Feature-detects support for .focus({preventScroll: true}), and uses
// a fallback kludge when not supported.
function focusPreventScroll(dom){if(dom.setActive)return dom.setActive();// in IE
if(preventScrollSupported)return dom.focus(preventScrollSupported);let stack=[];for(let cur=dom;cur;cur=cur.parentNode){stack.push(cur,cur.scrollTop,cur.scrollLeft);if(cur==cur.ownerDocument)break;}dom.focus(preventScrollSupported==null?{get preventScroll(){preventScrollSupported={preventScroll:true};return true;}}:undefined);if(!preventScrollSupported){preventScrollSupported=false;for(let i=0;i<stack.length;){let elt=stack[i++],top=stack[i++],left=stack[i++];if(elt.scrollTop!=top)elt.scrollTop=top;if(elt.scrollLeft!=left)elt.scrollLeft=left;}}}let scratchRange;function textRange(node,from,to=from){let range=scratchRange||(scratchRange=document.createRange());range.setEnd(node,to);range.setStart(node,from);return range;}function dispatchKey(elt,name,code){let options={key:name,code:name,keyCode:code,which:code,cancelable:true};let down=new KeyboardEvent("keydown",options);down.synthetic=true;elt.dispatchEvent(down);let up=new KeyboardEvent("keyup",options);up.synthetic=true;elt.dispatchEvent(up);return down.defaultPrevented||up.defaultPrevented;}function getRoot(node){while(node){if(node&&(node.nodeType==9||node.nodeType==11&&node.host))return node;node=node.assignedSlot||node.parentNode;}return null;}function clearAttributes(node){while(node.attributes.length)node.removeAttributeNode(node.attributes[0]);}function atElementStart(doc,selection){let node=selection.focusNode,offset=selection.focusOffset;if(!node||selection.anchorNode!=node||selection.anchorOffset!=offset)return false;// Safari can report bogus offsets (#1152)
offset=Math.min(offset,maxOffset(node));for(;;){if(offset){if(node.nodeType!=1)return false;let prev=node.childNodes[offset-1];if(prev.contentEditable=="false")offset--;else{node=prev;offset=maxOffset(node);}}else if(node==doc){return true;}else{offset=domIndex(node);node=node.parentNode;}}}function isScrolledToBottom(elt){return elt.scrollTop>Math.max(1,elt.scrollHeight-elt.clientHeight-4);}class DOMPos{constructor(node,offset,precise=true){this.node=node;this.offset=offset;this.precise=precise;}static before(dom,precise){return new DOMPos(dom.parentNode,domIndex(dom),precise);}static after(dom,precise){return new DOMPos(dom.parentNode,domIndex(dom)+1,precise);}}const noChildren=[];class ContentView{constructor(){this.parent=null;this.dom=null;this.flags=2/* ViewFlag.NodeDirty */;}get overrideDOMText(){return null;}get posAtStart(){return this.parent?this.parent.posBefore(this):0;}get posAtEnd(){return this.posAtStart+this.length;}posBefore(view){let pos=this.posAtStart;for(let child of this.children){if(child==view)return pos;pos+=child.length+child.breakAfter;}throw new RangeError("Invalid child in posBefore");}posAfter(view){return this.posBefore(view)+view.length;}sync(view,track){if(this.flags&2/* ViewFlag.NodeDirty */){let parent=this.dom;let prev=null,next;for(let child of this.children){if(child.flags&7/* ViewFlag.Dirty */){if(!child.dom&&(next=prev?prev.nextSibling:parent.firstChild)){let contentView=ContentView.get(next);if(!contentView||!contentView.parent&&contentView.canReuseDOM(child))child.reuseDOM(next);}child.sync(view,track);child.flags&=-8/* ViewFlag.Dirty */;}next=prev?prev.nextSibling:parent.firstChild;if(track&&!track.written&&track.node==parent&&next!=child.dom)track.written=true;if(child.dom.parentNode==parent){while(next&&next!=child.dom)next=rm$1(next);}else{parent.insertBefore(child.dom,next);}prev=child.dom;}next=prev?prev.nextSibling:parent.firstChild;if(next&&track&&track.node==parent)track.written=true;while(next)next=rm$1(next);}else if(this.flags&1/* ViewFlag.ChildDirty */){for(let child of this.children)if(child.flags&7/* ViewFlag.Dirty */){child.sync(view,track);child.flags&=-8/* ViewFlag.Dirty */;}}}reuseDOM(_dom){}localPosFromDOM(node,offset){let after;if(node==this.dom){after=this.dom.childNodes[offset];}else{let bias=maxOffset(node)==0?0:offset==0?-1:1;for(;;){let parent=node.parentNode;if(parent==this.dom)break;if(bias==0&&parent.firstChild!=parent.lastChild){if(node==parent.firstChild)bias=-1;else bias=1;}node=parent;}if(bias<0)after=node;else after=node.nextSibling;}if(after==this.dom.firstChild)return 0;while(after&&!ContentView.get(after))after=after.nextSibling;if(!after)return this.length;for(let i=0,pos=0;;i++){let child=this.children[i];if(child.dom==after)return pos;pos+=child.length+child.breakAfter;}}domBoundsAround(from,to,offset=0){let fromI=-1,fromStart=-1,toI=-1,toEnd=-1;for(let i=0,pos=offset,prevEnd=offset;i<this.children.length;i++){let child=this.children[i],end=pos+child.length;if(pos<from&&end>to)return child.domBoundsAround(from,to,pos);if(end>=from&&fromI==-1){fromI=i;fromStart=pos;}if(pos>to&&child.dom.parentNode==this.dom){toI=i;toEnd=prevEnd;break;}prevEnd=end;pos=end+child.breakAfter;}return{from:fromStart,to:toEnd<0?offset+this.length:toEnd,startDOM:(fromI?this.children[fromI-1].dom.nextSibling:null)||this.dom.firstChild,endDOM:toI<this.children.length&&toI>=0?this.children[toI].dom:null};}markDirty(andParent=false){this.flags|=2/* ViewFlag.NodeDirty */;this.markParentsDirty(andParent);}markParentsDirty(childList){for(let parent=this.parent;parent;parent=parent.parent){if(childList)parent.flags|=2/* ViewFlag.NodeDirty */;if(parent.flags&1/* ViewFlag.ChildDirty */)return;parent.flags|=1/* ViewFlag.ChildDirty */;childList=false;}}setParent(parent){if(this.parent!=parent){this.parent=parent;if(this.flags&7/* ViewFlag.Dirty */)this.markParentsDirty(true);}}setDOM(dom){if(this.dom==dom)return;if(this.dom)this.dom.cmView=null;this.dom=dom;dom.cmView=this;}get rootView(){for(let v=this;;){let parent=v.parent;if(!parent)return v;v=parent;}}replaceChildren(from,to,children=noChildren){this.markDirty();for(let i=from;i<to;i++){let child=this.children[i];if(child.parent==this&&children.indexOf(child)<0)child.destroy();}this.children.splice(from,to-from,...children);for(let i=0;i<children.length;i++)children[i].setParent(this);}ignoreMutation(_rec){return false;}ignoreEvent(_event){return false;}childCursor(pos=this.length){return new ChildCursor(this.children,pos,this.children.length);}childPos(pos,bias=1){return this.childCursor().findPos(pos,bias);}toString(){let name=this.constructor.name.replace("View","");return name+(this.children.length?"("+this.children.join()+")":this.length?"["+(name=="Text"?this.text:this.length)+"]":"")+(this.breakAfter?"#":"");}static get(node){return node.cmView;}get isEditable(){return true;}get isWidget(){return false;}get isHidden(){return false;}merge(from,to,source,hasStart,openStart,openEnd){return false;}become(other){return false;}canReuseDOM(other){return other.constructor==this.constructor&&!((this.flags|other.flags)&8/* ViewFlag.Composition */);}// When this is a zero-length view with a side, this should return a
// number <= 0 to indicate it is before its position, or a
// number > 0 when after its position.
getSide(){return 0;}destroy(){for(let child of this.children)if(child.parent==this)child.destroy();this.parent=null;}}ContentView.prototype.breakAfter=0;// Remove a DOM node and return its next sibling.
function rm$1(dom){let next=dom.nextSibling;dom.parentNode.removeChild(dom);return next;}class ChildCursor{constructor(children,pos,i){this.children=children;this.pos=pos;this.i=i;this.off=0;}findPos(pos,bias=1){for(;;){if(pos>this.pos||pos==this.pos&&(bias>0||this.i==0||this.children[this.i-1].breakAfter)){this.off=pos-this.pos;return this;}let next=this.children[--this.i];this.pos-=next.length+next.breakAfter;}}}function replaceRange(parent,fromI,fromOff,toI,toOff,insert,breakAtStart,openStart,openEnd){let{children}=parent;let before=children.length?children[fromI]:null;let last=insert.length?insert[insert.length-1]:null;let breakAtEnd=last?last.breakAfter:breakAtStart;// Change within a single child
if(fromI==toI&&before&&!breakAtStart&&!breakAtEnd&&insert.length<2&&before.merge(fromOff,toOff,insert.length?last:null,fromOff==0,openStart,openEnd))return;if(toI<children.length){let after=children[toI];// Make sure the end of the child after the update is preserved in `after`
if(after&&(toOff<after.length||after.breakAfter&&(last===null||last===void 0?void 0:last.breakAfter))){// If we're splitting a child, separate part of it to avoid that
// being mangled when updating the child before the update.
if(fromI==toI){after=after.split(toOff);toOff=0;}// If the element after the replacement should be merged with
// the last replacing element, update `content`
if(!breakAtEnd&&last&&after.merge(0,toOff,last,true,0,openEnd)){insert[insert.length-1]=after;}else{// Remove the start of the after element, if necessary, and
// add it to `content`.
if(toOff||after.children.length&&!after.children[0].length)after.merge(0,toOff,null,false,0,openEnd);insert.push(after);}}else if(after===null||after===void 0?void 0:after.breakAfter){// The element at `toI` is entirely covered by this range.
// Preserve its line break, if any.
if(last)last.breakAfter=1;else breakAtStart=1;}// Since we've handled the next element from the current elements
// now, make sure `toI` points after that.
toI++;}if(before){before.breakAfter=breakAtStart;if(fromOff>0){if(!breakAtStart&&insert.length&&before.merge(fromOff,before.length,insert[0],false,openStart,0)){before.breakAfter=insert.shift().breakAfter;}else if(fromOff<before.length||before.children.length&&before.children[before.children.length-1].length==0){before.merge(fromOff,before.length,null,false,openStart,0);}fromI++;}}// Try to merge widgets on the boundaries of the replacement
while(fromI<toI&&insert.length){if(children[toI-1].become(insert[insert.length-1])){toI--;insert.pop();openEnd=insert.length?0:openStart;}else if(children[fromI].become(insert[0])){fromI++;insert.shift();openStart=insert.length?0:openEnd;}else{break;}}if(!insert.length&&fromI&&toI<children.length&&!children[fromI-1].breakAfter&&children[toI].merge(0,0,children[fromI-1],false,openStart,openEnd))fromI--;if(fromI<toI||insert.length)parent.replaceChildren(fromI,toI,insert);}function mergeChildrenInto(parent,from,to,insert,openStart,openEnd){let cur=parent.childCursor();let{i:toI,off:toOff}=cur.findPos(to,1);let{i:fromI,off:fromOff}=cur.findPos(from,-1);let dLen=from-to;for(let view of insert)dLen+=view.length;parent.length+=dLen;replaceRange(parent,fromI,fromOff,toI,toOff,insert,0,openStart,openEnd);}let nav=typeof navigator!="undefined"?navigator:{userAgent:"",vendor:"",platform:""};let doc=typeof document!="undefined"?document:{documentElement:{style:{}}};const ie_edge=/*@__PURE__*/ /Edge\/(\d+)/.exec(nav.userAgent);const ie_upto10=/*@__PURE__*/ /MSIE \d/.test(nav.userAgent);const ie_11up=/*@__PURE__*/ /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(nav.userAgent);const ie=!!(ie_upto10||ie_11up||ie_edge);const gecko=!ie&&/*@__PURE__*/ /gecko\/(\d+)/i.test(nav.userAgent);const chrome=!ie&&/*@__PURE__*/ /Chrome\/(\d+)/.exec(nav.userAgent);const webkit=("webkitFontSmoothing"in doc.documentElement.style);const safari=!ie&&/*@__PURE__*/ /Apple Computer/.test(nav.vendor);const ios=safari&&(/*@__PURE__*/ /Mobile\/\w+/.test(nav.userAgent)||nav.maxTouchPoints>2);var browser={mac:ios||/*@__PURE__*/ /Mac/.test(nav.platform),windows:/*@__PURE__*/ /Win/.test(nav.platform),linux:/*@__PURE__*/ /Linux|X11/.test(nav.platform),ie,ie_version:ie_upto10?doc.documentMode||6:ie_11up?+ie_11up[1]:ie_edge?+ie_edge[1]:0,gecko,gecko_version:gecko?+(/*@__PURE__*/ /Firefox\/(\d+)/.exec(nav.userAgent)||[0,0])[1]:0,chrome:!!chrome,chrome_version:chrome?+chrome[1]:0,ios,android:/*@__PURE__*/ /Android\b/.test(nav.userAgent),safari,webkit_version:webkit?+(/*@__PURE__*/ /\bAppleWebKit\/(\d+)/.exec(navigator.userAgent)||[0,0])[1]:0,tabSize:doc.documentElement.style.tabSize!=null?"tab-size":"-moz-tab-size"};const MaxJoinLen=256;class TextView extends ContentView{constructor(text){super();this.text=text;}get length(){return this.text.length;}createDOM(textDOM){this.setDOM(textDOM||document.createTextNode(this.text));}sync(view,track){if(!this.dom)this.createDOM();if(this.dom.nodeValue!=this.text){if(track&&track.node==this.dom)track.written=true;this.dom.nodeValue=this.text;}}reuseDOM(dom){if(dom.nodeType==3)this.createDOM(dom);}merge(from,to,source){if(this.flags&8/* ViewFlag.Composition */||source&&(!(source instanceof TextView)||this.length-(to-from)+source.length>MaxJoinLen||source.flags&8/* ViewFlag.Composition */))return false;this.text=this.text.slice(0,from)+(source?source.text:"")+this.text.slice(to);this.markDirty();return true;}split(from){let result=new TextView(this.text.slice(from));this.text=this.text.slice(0,from);this.markDirty();result.flags|=this.flags&8/* ViewFlag.Composition */;return result;}localPosFromDOM(node,offset){return node==this.dom?offset:offset?this.text.length:0;}domAtPos(pos){return new DOMPos(this.dom,pos);}domBoundsAround(_from,_to,offset){return{from:offset,to:offset+this.length,startDOM:this.dom,endDOM:this.dom.nextSibling};}coordsAt(pos,side){return textCoords(this.dom,pos,side);}}class MarkView extends ContentView{constructor(mark,children=[],length=0){super();this.mark=mark;this.children=children;this.length=length;for(let ch of children)ch.setParent(this);}setAttrs(dom){clearAttributes(dom);if(this.mark.class)dom.className=this.mark.class;if(this.mark.attrs)for(let name in this.mark.attrs)dom.setAttribute(name,this.mark.attrs[name]);return dom;}canReuseDOM(other){return super.canReuseDOM(other)&&!((this.flags|other.flags)&8/* ViewFlag.Composition */);}reuseDOM(node){if(node.nodeName==this.mark.tagName.toUpperCase()){this.setDOM(node);this.flags|=4/* ViewFlag.AttrsDirty */|2/* ViewFlag.NodeDirty */;}}sync(view,track){if(!this.dom)this.setDOM(this.setAttrs(document.createElement(this.mark.tagName)));else if(this.flags&4/* ViewFlag.AttrsDirty */)this.setAttrs(this.dom);super.sync(view,track);}merge(from,to,source,_hasStart,openStart,openEnd){if(source&&(!(source instanceof MarkView&&source.mark.eq(this.mark))||from&&openStart<=0||to<this.length&&openEnd<=0))return false;mergeChildrenInto(this,from,to,source?source.children.slice():[],openStart-1,openEnd-1);this.markDirty();return true;}split(from){let result=[],off=0,detachFrom=-1,i=0;for(let elt of this.children){let end=off+elt.length;if(end>from)result.push(off<from?elt.split(from-off):elt);if(detachFrom<0&&off>=from)detachFrom=i;off=end;i++;}let length=this.length-from;this.length=from;if(detachFrom>-1){this.children.length=detachFrom;this.markDirty();}return new MarkView(this.mark,result,length);}domAtPos(pos){return inlineDOMAtPos(this,pos);}coordsAt(pos,side){return coordsInChildren(this,pos,side);}}function textCoords(text,pos,side){let length=text.nodeValue.length;if(pos>length)pos=length;let from=pos,to=pos,flatten=0;if(pos==0&&side<0||pos==length&&side>=0){if(!(browser.chrome||browser.gecko)){// These browsers reliably return valid rectangles for empty ranges
if(pos){from--;flatten=1;}// FIXME this is wrong in RTL text
else if(to<length){to++;flatten=-1;}}}else{if(side<0)from--;else if(to<length)to++;}let rects=textRange(text,from,to).getClientRects();if(!rects.length)return null;let rect=rects[(flatten?flatten<0:side>=0)?0:rects.length-1];if(browser.safari&&!flatten&&rect.width==0)rect=Array.prototype.find.call(rects,r=>r.width)||rect;return flatten?flattenRect(rect,flatten<0):rect||null;}// Also used for collapsed ranges that don't have a placeholder widget!
class WidgetView extends ContentView{static create(widget,length,side){return new WidgetView(widget,length,side);}constructor(widget,length,side){super();this.widget=widget;this.length=length;this.side=side;this.prevWidget=null;}split(from){let result=WidgetView.create(this.widget,this.length-from,this.side);this.length-=from;return result;}sync(view){if(!this.dom||!this.widget.updateDOM(this.dom,view)){if(this.dom&&this.prevWidget)this.prevWidget.destroy(this.dom);this.prevWidget=null;this.setDOM(this.widget.toDOM(view));if(!this.widget.editable)this.dom.contentEditable="false";}}getSide(){return this.side;}merge(from,to,source,hasStart,openStart,openEnd){if(source&&(!(source instanceof WidgetView)||!this.widget.compare(source.widget)||from>0&&openStart<=0||to<this.length&&openEnd<=0))return false;this.length=from+(source?source.length:0)+(this.length-to);return true;}become(other){if(other instanceof WidgetView&&other.side==this.side&&this.widget.constructor==other.widget.constructor){if(!this.widget.compare(other.widget))this.markDirty(true);if(this.dom&&!this.prevWidget)this.prevWidget=this.widget;this.widget=other.widget;this.length=other.length;return true;}return false;}ignoreMutation(){return true;}ignoreEvent(event){return this.widget.ignoreEvent(event);}get overrideDOMText(){if(this.length==0)return Text.empty;let top=this;while(top.parent)top=top.parent;let{view}=top,text=view&&view.state.doc,start=this.posAtStart;return text?text.slice(start,start+this.length):Text.empty;}domAtPos(pos){return(this.length?pos==0:this.side>0)?DOMPos.before(this.dom):DOMPos.after(this.dom,pos==this.length);}domBoundsAround(){return null;}coordsAt(pos,side){let custom=this.widget.coordsAt(this.dom,pos,side);if(custom)return custom;let rects=this.dom.getClientRects(),rect=null;if(!rects.length)return null;let fromBack=this.side?this.side<0:pos>0;for(let i=fromBack?rects.length-1:0;;i+=fromBack?-1:1){rect=rects[i];if(pos>0?i==0:i==rects.length-1||rect.top<rect.bottom)break;}return flattenRect(rect,!fromBack);}get isEditable(){return false;}get isWidget(){return true;}get isHidden(){return this.widget.isHidden;}destroy(){super.destroy();if(this.dom)this.widget.destroy(this.dom);}}// These are drawn around uneditable widgets to avoid a number of
// browser bugs that show up when the cursor is directly next to
// uneditable inline content.
class WidgetBufferView extends ContentView{constructor(side){super();this.side=side;}get length(){return 0;}merge(){return false;}become(other){return other instanceof WidgetBufferView&&other.side==this.side;}split(){return new WidgetBufferView(this.side);}sync(){if(!this.dom){let dom=document.createElement("img");dom.className="cm-widgetBuffer";dom.setAttribute("aria-hidden","true");this.setDOM(dom);}}getSide(){return this.side;}domAtPos(pos){return this.side>0?DOMPos.before(this.dom):DOMPos.after(this.dom);}localPosFromDOM(){return 0;}domBoundsAround(){return null;}coordsAt(pos){return this.dom.getBoundingClientRect();}get overrideDOMText(){return Text.empty;}get isHidden(){return true;}}TextView.prototype.children=WidgetView.prototype.children=WidgetBufferView.prototype.children=noChildren;function inlineDOMAtPos(parent,pos){let dom=parent.dom,{children}=parent,i=0;for(let off=0;i<children.length;i++){let child=children[i],end=off+child.length;if(end==off&&child.getSide()<=0)continue;if(pos>off&&pos<end&&child.dom.parentNode==dom)return child.domAtPos(pos-off);if(pos<=off)break;off=end;}for(let j=i;j>0;j--){let prev=children[j-1];if(prev.dom.parentNode==dom)return prev.domAtPos(prev.length);}for(let j=i;j<children.length;j++){let next=children[j];if(next.dom.parentNode==dom)return next.domAtPos(0);}return new DOMPos(dom,0);}// Assumes `view`, if a mark view, has precisely 1 child.
function joinInlineInto(parent,view,open){let last,{children}=parent;if(open>0&&view instanceof MarkView&&children.length&&(last=children[children.length-1])instanceof MarkView&&last.mark.eq(view.mark)){joinInlineInto(last,view.children[0],open-1);}else{children.push(view);view.setParent(parent);}parent.length+=view.length;}function coordsInChildren(view,pos,side){let before=null,beforePos=-1,after=null,afterPos=-1;function scan(view,pos){for(let i=0,off=0;i<view.children.length&&off<=pos;i++){let child=view.children[i],end=off+child.length;if(end>=pos){if(child.children.length){scan(child,pos-off);}else if((!after||after.isHidden&&side>0)&&(end>pos||off==end&&child.getSide()>0)){after=child;afterPos=pos-off;}else if(off<pos||off==end&&child.getSide()<0&&!child.isHidden){before=child;beforePos=pos-off;}}off=end;}}scan(view,pos);let target=(side<0?before:after)||before||after;if(target)return target.coordsAt(Math.max(0,target==before?beforePos:afterPos),side);return fallbackRect(view);}function fallbackRect(view){let last=view.dom.lastChild;if(!last)return view.dom.getBoundingClientRect();let rects=clientRectsFor(last);return rects[rects.length-1]||null;}function combineAttrs(source,target){for(let name in source){if(name=="class"&&target.class)target.class+=" "+source.class;else if(name=="style"&&target.style)target.style+=";"+source.style;else target[name]=source[name];}return target;}const noAttrs=/*@__PURE__*/Object.create(null);function attrsEq(a,b,ignore){if(a==b)return true;if(!a)a=noAttrs;if(!b)b=noAttrs;let keysA=Object.keys(a),keysB=Object.keys(b);if(keysA.length-(ignore&&keysA.indexOf(ignore)>-1?1:0)!=keysB.length-(ignore&&keysB.indexOf(ignore)>-1?1:0))return false;for(let key of keysA){if(key!=ignore&&(keysB.indexOf(key)==-1||a[key]!==b[key]))return false;}return true;}function updateAttrs(dom,prev,attrs){let changed=false;if(prev)for(let name in prev)if(!(attrs&&name in attrs)){changed=true;if(name=="style")dom.style.cssText="";else dom.removeAttribute(name);}if(attrs)for(let name in attrs)if(!(prev&&prev[name]==attrs[name])){changed=true;if(name=="style")dom.style.cssText=attrs[name];else dom.setAttribute(name,attrs[name]);}return changed;}function getAttrs$1(dom){let attrs=Object.create(null);for(let i=0;i<dom.attributes.length;i++){let attr=dom.attributes[i];attrs[attr.name]=attr.value;}return attrs;}class LineView extends ContentView{constructor(){super(...arguments);this.children=[];this.length=0;this.prevAttrs=undefined;this.attrs=null;this.breakAfter=0;}// Consumes source
merge(from,to,source,hasStart,openStart,openEnd){if(source){if(!(source instanceof LineView))return false;if(!this.dom)source.transferDOM(this);// Reuse source.dom when appropriate
}if(hasStart)this.setDeco(source?source.attrs:null);mergeChildrenInto(this,from,to,source?source.children.slice():[],openStart,openEnd);return true;}split(at){let end=new LineView();end.breakAfter=this.breakAfter;if(this.length==0)return end;let{i,off}=this.childPos(at);if(off){end.append(this.children[i].split(off),0);this.children[i].merge(off,this.children[i].length,null,false,0,0);i++;}for(let j=i;j<this.children.length;j++)end.append(this.children[j],0);while(i>0&&this.children[i-1].length==0)this.children[--i].destroy();this.children.length=i;this.markDirty();this.length=at;return end;}transferDOM(other){if(!this.dom)return;this.markDirty();other.setDOM(this.dom);other.prevAttrs=this.prevAttrs===undefined?this.attrs:this.prevAttrs;this.prevAttrs=undefined;this.dom=null;}setDeco(attrs){if(!attrsEq(this.attrs,attrs)){if(this.dom){this.prevAttrs=this.attrs;this.markDirty();}this.attrs=attrs;}}append(child,openStart){joinInlineInto(this,child,openStart);}// Only called when building a line view in ContentBuilder
addLineDeco(deco){let attrs=deco.spec.attributes,cls=deco.spec.class;if(attrs)this.attrs=combineAttrs(attrs,this.attrs||{});if(cls)this.attrs=combineAttrs({class:cls},this.attrs||{});}domAtPos(pos){return inlineDOMAtPos(this,pos);}reuseDOM(node){if(node.nodeName=="DIV"){this.setDOM(node);this.flags|=4/* ViewFlag.AttrsDirty */|2/* ViewFlag.NodeDirty */;}}sync(view,track){var _a;if(!this.dom){this.setDOM(document.createElement("div"));this.dom.className="cm-line";this.prevAttrs=this.attrs?null:undefined;}else if(this.flags&4/* ViewFlag.AttrsDirty */){clearAttributes(this.dom);this.dom.className="cm-line";this.prevAttrs=this.attrs?null:undefined;}if(this.prevAttrs!==undefined){updateAttrs(this.dom,this.prevAttrs,this.attrs);this.dom.classList.add("cm-line");this.prevAttrs=undefined;}super.sync(view,track);let last=this.dom.lastChild;while(last&&ContentView.get(last)instanceof MarkView)last=last.lastChild;if(!last||!this.length||last.nodeName!="BR"&&((_a=ContentView.get(last))===null||_a===void 0?void 0:_a.isEditable)==false&&(!browser.ios||!this.children.some(ch=>ch instanceof TextView))){let hack=document.createElement("BR");hack.cmIgnore=true;this.dom.appendChild(hack);}}measureTextSize(){if(this.children.length==0||this.length>20)return null;let totalWidth=0,textHeight;for(let child of this.children){if(!(child instanceof TextView)||/[^ -~]/.test(child.text))return null;let rects=clientRectsFor(child.dom);if(rects.length!=1)return null;totalWidth+=rects[0].width;textHeight=rects[0].height;}return!totalWidth?null:{lineHeight:this.dom.getBoundingClientRect().height,charWidth:totalWidth/this.length,textHeight};}coordsAt(pos,side){let rect=coordsInChildren(this,pos,side);// Correct rectangle height for empty lines when the returned
// height is larger than the text height.
if(!this.children.length&&rect&&this.parent){let{heightOracle}=this.parent.view.viewState,height=rect.bottom-rect.top;if(Math.abs(height-heightOracle.lineHeight)<2&&heightOracle.textHeight<height){let dist=(height-heightOracle.textHeight)/2;return{top:rect.top+dist,bottom:rect.bottom-dist,left:rect.left,right:rect.left};}}return rect;}become(_other){return false;}covers(){return true;}static find(docView,pos){for(let i=0,off=0;i<docView.children.length;i++){let block=docView.children[i],end=off+block.length;if(end>=pos){if(block instanceof LineView)return block;if(end>pos)break;}off=end+block.breakAfter;}return null;}}class BlockWidgetView extends ContentView{constructor(widget,length,deco){super();this.widget=widget;this.length=length;this.deco=deco;this.breakAfter=0;this.prevWidget=null;}merge(from,to,source,_takeDeco,openStart,openEnd){if(source&&(!(source instanceof BlockWidgetView)||!this.widget.compare(source.widget)||from>0&&openStart<=0||to<this.length&&openEnd<=0))return false;this.length=from+(source?source.length:0)+(this.length-to);return true;}domAtPos(pos){return pos==0?DOMPos.before(this.dom):DOMPos.after(this.dom,pos==this.length);}split(at){let len=this.length-at;this.length=at;let end=new BlockWidgetView(this.widget,len,this.deco);end.breakAfter=this.breakAfter;return end;}get children(){return noChildren;}sync(view){if(!this.dom||!this.widget.updateDOM(this.dom,view)){if(this.dom&&this.prevWidget)this.prevWidget.destroy(this.dom);this.prevWidget=null;this.setDOM(this.widget.toDOM(view));if(!this.widget.editable)this.dom.contentEditable="false";}}get overrideDOMText(){return this.parent?this.parent.view.state.doc.slice(this.posAtStart,this.posAtEnd):Text.empty;}domBoundsAround(){return null;}become(other){if(other instanceof BlockWidgetView&&other.widget.constructor==this.widget.constructor){if(!other.widget.compare(this.widget))this.markDirty(true);if(this.dom&&!this.prevWidget)this.prevWidget=this.widget;this.widget=other.widget;this.length=other.length;this.deco=other.deco;this.breakAfter=other.breakAfter;return true;}return false;}ignoreMutation(){return true;}ignoreEvent(event){return this.widget.ignoreEvent(event);}get isEditable(){return false;}get isWidget(){return true;}coordsAt(pos,side){return this.widget.coordsAt(this.dom,pos,side);}destroy(){super.destroy();if(this.dom)this.widget.destroy(this.dom);}covers(side){let{startSide,endSide}=this.deco;return startSide==endSide?false:side<0?startSide<0:endSide>0;}}/**
  Widgets added to the content are described by subclasses of this
  class. Using a description object like that makes it possible to
  delay creating of the DOM structure for a widget until it is
  needed, and to avoid redrawing widgets even if the decorations
  that define them are recreated.
  */class WidgetType{/**
      Compare this instance to another instance of the same type.
      (TypeScript can't express this, but only instances of the same
      specific class will be passed to this method.) This is used to
      avoid redrawing widgets when they are replaced by a new
      decoration of the same type. The default implementation just
      returns `false`, which will cause new instances of the widget to
      always be redrawn.
      */eq(widget){return false;}/**
      Update a DOM element created by a widget of the same type (but
      different, non-`eq` content) to reflect this widget. May return
      true to indicate that it could update, false to indicate it
      couldn't (in which case the widget will be redrawn). The default
      implementation just returns false.
      */updateDOM(dom,view){return false;}/**
      @internal
      */compare(other){return this==other||this.constructor==other.constructor&&this.eq(other);}/**
      The estimated height this widget will have, to be used when
      estimating the height of content that hasn't been drawn. May
      return -1 to indicate you don't know. The default implementation
      returns -1.
      */get estimatedHeight(){return-1;}/**
      For inline widgets that are displayed inline (as opposed to
      `inline-block`) and introduce line breaks (through `<br>` tags
      or textual newlines), this must indicate the amount of line
      breaks they introduce. Defaults to 0.
      */get lineBreaks(){return 0;}/**
      Can be used to configure which kinds of events inside the widget
      should be ignored by the editor. The default is to ignore all
      events.
      */ignoreEvent(event){return true;}/**
      Override the way screen coordinates for positions at/in the
      widget are found. `pos` will be the offset into the widget, and
      `side` the side of the position that is being queried—less than
      zero for before, greater than zero for after, and zero for
      directly at that position.
      */coordsAt(dom,pos,side){return null;}/**
      @internal
      */get isHidden(){return false;}/**
      @internal
      */get editable(){return false;}/**
      This is called when the an instance of the widget is removed
      from the editor view.
      */destroy(dom){}}/**
  The different types of blocks that can occur in an editor view.
  */var BlockType=/*@__PURE__*/function(BlockType){/**
      A line of text.
      */BlockType[BlockType["Text"]=0]="Text";/**
      A block widget associated with the position after it.
      */BlockType[BlockType["WidgetBefore"]=1]="WidgetBefore";/**
      A block widget associated with the position before it.
      */BlockType[BlockType["WidgetAfter"]=2]="WidgetAfter";/**
      A block widget [replacing](https://codemirror.net/6/docs/ref/#view.Decoration^replace) a range of content.
      */BlockType[BlockType["WidgetRange"]=3]="WidgetRange";return BlockType;}(BlockType||(BlockType={}));/**
  A decoration provides information on how to draw or style a piece
  of content. You'll usually use it wrapped in a
  [`Range`](https://codemirror.net/6/docs/ref/#state.Range), which adds a start and end position.
  @nonabstract
  */class Decoration extends RangeValue{constructor(/**
      @internal
      */startSide,/**
      @internal
      */endSide,/**
      @internal
      */widget,/**
      The config object used to create this decoration. You can
      include additional properties in there to store metadata about
      your decoration.
      */spec){super();this.startSide=startSide;this.endSide=endSide;this.widget=widget;this.spec=spec;}/**
      @internal
      */get heightRelevant(){return false;}/**
      Create a mark decoration, which influences the styling of the
      content in its range. Nested mark decorations will cause nested
      DOM elements to be created. Nesting order is determined by
      precedence of the [facet](https://codemirror.net/6/docs/ref/#view.EditorView^decorations), with
      the higher-precedence decorations creating the inner DOM nodes.
      Such elements are split on line boundaries and on the boundaries
      of lower-precedence decorations.
      */static mark(spec){return new MarkDecoration(spec);}/**
      Create a widget decoration, which displays a DOM element at the
      given position.
      */static widget(spec){let side=Math.max(-1e4,Math.min(10000,spec.side||0)),block=!!spec.block;side+=block&&!spec.inlineOrder?side>0?300000000/* Side.BlockAfter */:-4e8/* Side.BlockBefore */:side>0?100000000/* Side.InlineAfter */:-1e8/* Side.InlineBefore */;return new PointDecoration(spec,side,side,block,spec.widget||null,false);}/**
      Create a replace decoration which replaces the given range with
      a widget, or simply hides it.
      */static replace(spec){let block=!!spec.block,startSide,endSide;if(spec.isBlockGap){startSide=-5e8/* Side.GapStart */;endSide=400000000/* Side.GapEnd */;}else{let{start,end}=getInclusive(spec,block);startSide=(start?block?-3e8/* Side.BlockIncStart */:-1/* Side.InlineIncStart */:500000000/* Side.NonIncStart */)-1;endSide=(end?block?200000000/* Side.BlockIncEnd */:1/* Side.InlineIncEnd */:-6e8/* Side.NonIncEnd */)+1;}return new PointDecoration(spec,startSide,endSide,block,spec.widget||null,true);}/**
      Create a line decoration, which can add DOM attributes to the
      line starting at the given position.
      */static line(spec){return new LineDecoration(spec);}/**
      Build a [`DecorationSet`](https://codemirror.net/6/docs/ref/#view.DecorationSet) from the given
      decorated range or ranges. If the ranges aren't already sorted,
      pass `true` for `sort` to make the library sort them for you.
      */static set(of,sort=false){return RangeSet.of(of,sort);}/**
      @internal
      */hasHeight(){return this.widget?this.widget.estimatedHeight>-1:false;}}/**
  The empty set of decorations.
  */Decoration.none=RangeSet.empty;class MarkDecoration extends Decoration{constructor(spec){let{start,end}=getInclusive(spec);super(start?-1/* Side.InlineIncStart */:500000000/* Side.NonIncStart */,end?1/* Side.InlineIncEnd */:-6e8/* Side.NonIncEnd */,null,spec);this.tagName=spec.tagName||"span";this.class=spec.class||"";this.attrs=spec.attributes||null;}eq(other){var _a,_b;return this==other||other instanceof MarkDecoration&&this.tagName==other.tagName&&(this.class||((_a=this.attrs)===null||_a===void 0?void 0:_a.class))==(other.class||((_b=other.attrs)===null||_b===void 0?void 0:_b.class))&&attrsEq(this.attrs,other.attrs,"class");}range(from,to=from){if(from>=to)throw new RangeError("Mark decorations may not be empty");return super.range(from,to);}}MarkDecoration.prototype.point=false;class LineDecoration extends Decoration{constructor(spec){super(-2e8/* Side.Line */,-2e8/* Side.Line */,null,spec);}eq(other){return other instanceof LineDecoration&&this.spec.class==other.spec.class&&attrsEq(this.spec.attributes,other.spec.attributes);}range(from,to=from){if(to!=from)throw new RangeError("Line decoration ranges must be zero-length");return super.range(from,to);}}LineDecoration.prototype.mapMode=MapMode.TrackBefore;LineDecoration.prototype.point=true;class PointDecoration extends Decoration{constructor(spec,startSide,endSide,block,widget,isReplace){super(startSide,endSide,widget,spec);this.block=block;this.isReplace=isReplace;this.mapMode=!block?MapMode.TrackDel:startSide<=0?MapMode.TrackBefore:MapMode.TrackAfter;}// Only relevant when this.block == true
get type(){return this.startSide!=this.endSide?BlockType.WidgetRange:this.startSide<=0?BlockType.WidgetBefore:BlockType.WidgetAfter;}get heightRelevant(){return this.block||!!this.widget&&(this.widget.estimatedHeight>=5||this.widget.lineBreaks>0);}eq(other){return other instanceof PointDecoration&&widgetsEq(this.widget,other.widget)&&this.block==other.block&&this.startSide==other.startSide&&this.endSide==other.endSide;}range(from,to=from){if(this.isReplace&&(from>to||from==to&&this.startSide>0&&this.endSide<=0))throw new RangeError("Invalid range for replacement decoration");if(!this.isReplace&&to!=from)throw new RangeError("Widget decorations can only have zero-length ranges");return super.range(from,to);}}PointDecoration.prototype.point=true;function getInclusive(spec,block=false){let{inclusiveStart:start,inclusiveEnd:end}=spec;if(start==null)start=spec.inclusive;if(end==null)end=spec.inclusive;return{start:start!==null&&start!==void 0?start:block,end:end!==null&&end!==void 0?end:block};}function widgetsEq(a,b){return a==b||!!(a&&b&&a.compare(b));}function addRange(from,to,ranges,margin=0){let last=ranges.length-1;if(last>=0&&ranges[last]+margin>=from)ranges[last]=Math.max(ranges[last],to);else ranges.push(from,to);}class ContentBuilder{constructor(doc,pos,end,disallowBlockEffectsFor){this.doc=doc;this.pos=pos;this.end=end;this.disallowBlockEffectsFor=disallowBlockEffectsFor;this.content=[];this.curLine=null;this.breakAtStart=0;this.pendingBuffer=0/* Buf.No */;this.bufferMarks=[];// Set to false directly after a widget that covers the position after it
this.atCursorPos=true;this.openStart=-1;this.openEnd=-1;this.text="";this.textOff=0;this.cursor=doc.iter();this.skip=pos;}posCovered(){if(this.content.length==0)return!this.breakAtStart&&this.doc.lineAt(this.pos).from!=this.pos;let last=this.content[this.content.length-1];return!(last.breakAfter||last instanceof BlockWidgetView&&last.deco.endSide<0);}getLine(){if(!this.curLine){this.content.push(this.curLine=new LineView());this.atCursorPos=true;}return this.curLine;}flushBuffer(active=this.bufferMarks){if(this.pendingBuffer){this.curLine.append(wrapMarks(new WidgetBufferView(-1),active),active.length);this.pendingBuffer=0/* Buf.No */;}}addBlockWidget(view){this.flushBuffer();this.curLine=null;this.content.push(view);}finish(openEnd){if(this.pendingBuffer&&openEnd<=this.bufferMarks.length)this.flushBuffer();else this.pendingBuffer=0/* Buf.No */;if(!this.posCovered()&&!(openEnd&&this.content.length&&this.content[this.content.length-1]instanceof BlockWidgetView))this.getLine();}buildText(length,active,openStart){while(length>0){if(this.textOff==this.text.length){let{value,lineBreak,done}=this.cursor.next(this.skip);this.skip=0;if(done)throw new Error("Ran out of text content when drawing inline views");if(lineBreak){if(!this.posCovered())this.getLine();if(this.content.length)this.content[this.content.length-1].breakAfter=1;else this.breakAtStart=1;this.flushBuffer();this.curLine=null;this.atCursorPos=true;length--;continue;}else{this.text=value;this.textOff=0;}}let take=Math.min(this.text.length-this.textOff,length,512/* T.Chunk */);this.flushBuffer(active.slice(active.length-openStart));this.getLine().append(wrapMarks(new TextView(this.text.slice(this.textOff,this.textOff+take)),active),openStart);this.atCursorPos=true;this.textOff+=take;length-=take;openStart=0;}}span(from,to,active,openStart){this.buildText(to-from,active,openStart);this.pos=to;if(this.openStart<0)this.openStart=openStart;}point(from,to,deco,active,openStart,index){if(this.disallowBlockEffectsFor[index]&&deco instanceof PointDecoration){if(deco.block)throw new RangeError("Block decorations may not be specified via plugins");if(to>this.doc.lineAt(this.pos).to)throw new RangeError("Decorations that replace line breaks may not be specified via plugins");}let len=to-from;if(deco instanceof PointDecoration){if(deco.block){if(deco.startSide>0&&!this.posCovered())this.getLine();this.addBlockWidget(new BlockWidgetView(deco.widget||NullWidget.block,len,deco));}else{let view=WidgetView.create(deco.widget||NullWidget.inline,len,len?0:deco.startSide);let cursorBefore=this.atCursorPos&&!view.isEditable&&openStart<=active.length&&(from<to||deco.startSide>0);let cursorAfter=!view.isEditable&&(from<to||openStart>active.length||deco.startSide<=0);let line=this.getLine();if(this.pendingBuffer==2/* Buf.IfCursor */&&!cursorBefore&&!view.isEditable)this.pendingBuffer=0/* Buf.No */;this.flushBuffer(active);if(cursorBefore){line.append(wrapMarks(new WidgetBufferView(1),active),openStart);openStart=active.length+Math.max(0,openStart-active.length);}line.append(wrapMarks(view,active),openStart);this.atCursorPos=cursorAfter;this.pendingBuffer=!cursorAfter?0/* Buf.No */:from<to||openStart>active.length?1/* Buf.Yes */:2/* Buf.IfCursor */;if(this.pendingBuffer)this.bufferMarks=active.slice();}}else if(this.doc.lineAt(this.pos).from==this.pos){// Line decoration
this.getLine().addLineDeco(deco);}if(len){// Advance the iterator past the replaced content
if(this.textOff+len<=this.text.length){this.textOff+=len;}else{this.skip+=len-(this.text.length-this.textOff);this.text="";this.textOff=0;}this.pos=to;}if(this.openStart<0)this.openStart=openStart;}static build(text,from,to,decorations,dynamicDecorationMap){let builder=new ContentBuilder(text,from,to,dynamicDecorationMap);builder.openEnd=RangeSet.spans(decorations,from,to,builder);if(builder.openStart<0)builder.openStart=builder.openEnd;builder.finish(builder.openEnd);return builder;}}function wrapMarks(view,active){for(let mark of active)view=new MarkView(mark,[view],view.length);return view;}class NullWidget extends WidgetType{constructor(tag){super();this.tag=tag;}eq(other){return other.tag==this.tag;}toDOM(){return document.createElement(this.tag);}updateDOM(elt){return elt.nodeName.toLowerCase()==this.tag;}get isHidden(){return true;}}NullWidget.inline=/*@__PURE__*/new NullWidget("span");NullWidget.block=/*@__PURE__*/new NullWidget("div");/**
  Used to indicate [text direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection).
  */var Direction=/*@__PURE__*/function(Direction){// (These are chosen to match the base levels, in bidi algorithm
// terms, of spans in that direction.)
/**
      Left-to-right.
      */Direction[Direction["LTR"]=0]="LTR";/**
      Right-to-left.
      */Direction[Direction["RTL"]=1]="RTL";return Direction;}(Direction||(Direction={}));const LTR=Direction.LTR,RTL=Direction.RTL;// Decode a string with each type encoded as log2(type)
function dec(str){let result=[];for(let i=0;i<str.length;i++)result.push(1<<+str[i]);return result;}// Character types for codepoints 0 to 0xf8
const LowTypes=/*@__PURE__*/dec("88888888888888888888888888888888888666888888787833333333337888888000000000000000000000000008888880000000000000000000000000088888888888888888888888888888888888887866668888088888663380888308888800000000000000000000000800000000000000000000000000000008");// Character types for codepoints 0x600 to 0x6f9
const ArabicTypes=/*@__PURE__*/dec("4444448826627288999999999992222222222222222222222222222222222222222222222229999999999999999999994444444444644222822222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222999999949999999229989999223333333333");const Brackets=/*@__PURE__*/Object.create(null),BracketStack=[];// There's a lot more in
// https://www.unicode.org/Public/UCD/latest/ucd/BidiBrackets.txt,
// which are left out to keep code size down.
for(let p of["()","[]","{}"]){let l=/*@__PURE__*/p.charCodeAt(0),r=/*@__PURE__*/p.charCodeAt(1);Brackets[l]=r;Brackets[r]=-l;}function charType(ch){return ch<=0xf7?LowTypes[ch]:0x590<=ch&&ch<=0x5f4?2/* T.R */:0x600<=ch&&ch<=0x6f9?ArabicTypes[ch-0x600]:0x6ee<=ch&&ch<=0x8ac?4/* T.AL */:0x2000<=ch&&ch<=0x200c?256/* T.NI */:0xfb50<=ch&&ch<=0xfdff?4/* T.AL */:1/* T.L */;}const BidiRE=/[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac\ufb50-\ufdff]/;/**
  Represents a contiguous range of text that has a single direction
  (as in left-to-right or right-to-left).
  */class BidiSpan{/**
      The direction of this span.
      */get dir(){return this.level%2?RTL:LTR;}/**
      @internal
      */constructor(/**
      The start of the span (relative to the start of the line).
      */from,/**
      The end of the span.
      */to,/**
      The ["bidi
      level"](https://unicode.org/reports/tr9/#Basic_Display_Algorithm)
      of the span (in this context, 0 means
      left-to-right, 1 means right-to-left, 2 means left-to-right
      number inside right-to-left text).
      */level){this.from=from;this.to=to;this.level=level;}/**
      @internal
      */side(end,dir){return this.dir==dir==end?this.to:this.from;}/**
      @internal
      */forward(forward,dir){return forward==(this.dir==dir);}/**
      @internal
      */static find(order,index,level,assoc){let maybe=-1;for(let i=0;i<order.length;i++){let span=order[i];if(span.from<=index&&span.to>=index){if(span.level==level)return i;// When multiple spans match, if assoc != 0, take the one that
// covers that side, otherwise take the one with the minimum
// level.
if(maybe<0||(assoc!=0?assoc<0?span.from<index:span.to>index:order[maybe].level>span.level))maybe=i;}}if(maybe<0)throw new RangeError("Index out of range");return maybe;}}function isolatesEq(a,b){if(a.length!=b.length)return false;for(let i=0;i<a.length;i++){let iA=a[i],iB=b[i];if(iA.from!=iB.from||iA.to!=iB.to||iA.direction!=iB.direction||!isolatesEq(iA.inner,iB.inner))return false;}return true;}// Reused array of character types
const types=[];// Fill in the character types (in `types`) from `from` to `to` and
// apply W normalization rules.
function computeCharTypes(line,rFrom,rTo,isolates,outerType){for(let iI=0;iI<=isolates.length;iI++){let from=iI?isolates[iI-1].to:rFrom,to=iI<isolates.length?isolates[iI].from:rTo;let prevType=iI?256/* T.NI */:outerType;// W1. Examine each non-spacing mark (NSM) in the level run, and
// change the type of the NSM to the type of the previous
// character. If the NSM is at the start of the level run, it will
// get the type of sor.
// W2. Search backwards from each instance of a European number
// until the first strong type (R, L, AL, or sor) is found. If an
// AL is found, change the type of the European number to Arabic
// number.
// W3. Change all ALs to R.
// (Left after this: L, R, EN, AN, ET, CS, NI)
for(let i=from,prev=prevType,prevStrong=prevType;i<to;i++){let type=charType(line.charCodeAt(i));if(type==512/* T.NSM */)type=prev;else if(type==8/* T.EN */&&prevStrong==4/* T.AL */)type=16/* T.AN */;types[i]=type==4/* T.AL */?2/* T.R */:type;if(type&7/* T.Strong */)prevStrong=type;prev=type;}// W5. A sequence of European terminators adjacent to European
// numbers changes to all European numbers.
// W6. Otherwise, separators and terminators change to Other
// Neutral.
// W7. Search backwards from each instance of a European number
// until the first strong type (R, L, or sor) is found. If an L is
// found, then change the type of the European number to L.
// (Left after this: L, R, EN+AN, NI)
for(let i=from,prev=prevType,prevStrong=prevType;i<to;i++){let type=types[i];if(type==128/* T.CS */){if(i<to-1&&prev==types[i+1]&&prev&24/* T.Num */)type=types[i]=prev;else types[i]=256/* T.NI */;}else if(type==64/* T.ET */){let end=i+1;while(end<to&&types[end]==64/* T.ET */)end++;let replace=i&&prev==8/* T.EN */||end<rTo&&types[end]==8/* T.EN */?prevStrong==1/* T.L */?1/* T.L */:8/* T.EN */:256/* T.NI */;for(let j=i;j<end;j++)types[j]=replace;i=end-1;}else if(type==8/* T.EN */&&prevStrong==1/* T.L */){types[i]=1/* T.L */;}prev=type;if(type&7/* T.Strong */)prevStrong=type;}}}// Process brackets throughout a run sequence.
function processBracketPairs(line,rFrom,rTo,isolates,outerType){let oppositeType=outerType==1/* T.L */?2/* T.R */:1/* T.L */;for(let iI=0,sI=0,context=0;iI<=isolates.length;iI++){let from=iI?isolates[iI-1].to:rFrom,to=iI<isolates.length?isolates[iI].from:rTo;// N0. Process bracket pairs in an isolating run sequence
// sequentially in the logical order of the text positions of the
// opening paired brackets using the logic given below. Within this
// scope, bidirectional types EN and AN are treated as R.
for(let i=from,ch,br,type;i<to;i++){// Keeps [startIndex, type, strongSeen] triples for each open
// bracket on BracketStack.
if(br=Brackets[ch=line.charCodeAt(i)]){if(br<0){// Closing bracket
for(let sJ=sI-3;sJ>=0;sJ-=3){if(BracketStack[sJ+1]==-br){let flags=BracketStack[sJ+2];let type=flags&2/* Bracketed.EmbedInside */?outerType:!(flags&4/* Bracketed.OppositeInside */)?0:flags&1/* Bracketed.OppositeBefore */?oppositeType:outerType;if(type)types[i]=types[BracketStack[sJ]]=type;sI=sJ;break;}}}else if(BracketStack.length==189/* Bracketed.MaxDepth */){break;}else{BracketStack[sI++]=i;BracketStack[sI++]=ch;BracketStack[sI++]=context;}}else if((type=types[i])==2/* T.R */||type==1/* T.L */){let embed=type==outerType;context=embed?0:1/* Bracketed.OppositeBefore */;for(let sJ=sI-3;sJ>=0;sJ-=3){let cur=BracketStack[sJ+2];if(cur&2/* Bracketed.EmbedInside */)break;if(embed){BracketStack[sJ+2]|=2/* Bracketed.EmbedInside */;}else{if(cur&4/* Bracketed.OppositeInside */)break;BracketStack[sJ+2]|=4/* Bracketed.OppositeInside */;}}}}}}function processNeutrals(rFrom,rTo,isolates,outerType){for(let iI=0,prev=outerType;iI<=isolates.length;iI++){let from=iI?isolates[iI-1].to:rFrom,to=iI<isolates.length?isolates[iI].from:rTo;// N1. A sequence of neutrals takes the direction of the
// surrounding strong text if the text on both sides has the same
// direction. European and Arabic numbers act as if they were R in
// terms of their influence on neutrals. Start-of-level-run (sor)
// and end-of-level-run (eor) are used at level run boundaries.
// N2. Any remaining neutrals take the embedding direction.
// (Left after this: L, R, EN+AN)
for(let i=from;i<to;){let type=types[i];if(type==256/* T.NI */){let end=i+1;for(;;){if(end==to){if(iI==isolates.length)break;end=isolates[iI++].to;to=iI<isolates.length?isolates[iI].from:rTo;}else if(types[end]==256/* T.NI */){end++;}else{break;}}let beforeL=prev==1/* T.L */;let afterL=(end<rTo?types[end]:outerType)==1/* T.L */;let replace=beforeL==afterL?beforeL?1/* T.L */:2/* T.R */:outerType;for(let j=end,jI=iI,fromJ=jI?isolates[jI-1].to:rFrom;j>i;){if(j==fromJ){j=isolates[--jI].from;fromJ=jI?isolates[jI-1].to:rFrom;}types[--j]=replace;}i=end;}else{prev=type;i++;}}}}// Find the contiguous ranges of character types in a given range, and
// emit spans for them. Flip the order of the spans as appropriate
// based on the level, and call through to compute the spans for
// isolates at the proper point.
function emitSpans(line,from,to,level,baseLevel,isolates,order){let ourType=level%2?2/* T.R */:1/* T.L */;if(level%2==baseLevel%2){// Same dir as base direction, don't flip
for(let iCh=from,iI=0;iCh<to;){// Scan a section of characters in direction ourType, unless
// there's another type of char right after iCh, in which case
// we scan a section of other characters (which, if ourType ==
// T.L, may contain both T.R and T.AN chars).
let sameDir=true,isNum=false;if(iI==isolates.length||iCh<isolates[iI].from){let next=types[iCh];if(next!=ourType){sameDir=false;isNum=next==16/* T.AN */;}}// Holds an array of isolates to pass to a recursive call if we
// must recurse (to distinguish T.AN inside an RTL section in
// LTR text), null if we can emit directly
let recurse=!sameDir&&ourType==1/* T.L */?[]:null;let localLevel=sameDir?level:level+1;let iScan=iCh;run:for(;;){if(iI<isolates.length&&iScan==isolates[iI].from){if(isNum)break run;let iso=isolates[iI];// Scan ahead to verify that there is another char in this dir after the isolate(s)
if(!sameDir)for(let upto=iso.to,jI=iI+1;;){if(upto==to)break run;if(jI<isolates.length&&isolates[jI].from==upto)upto=isolates[jI++].to;else if(types[upto]==ourType)break run;else break;}iI++;if(recurse){recurse.push(iso);}else{if(iso.from>iCh)order.push(new BidiSpan(iCh,iso.from,localLevel));let dirSwap=iso.direction==LTR!=!(localLevel%2);computeSectionOrder(line,dirSwap?level+1:level,baseLevel,iso.inner,iso.from,iso.to,order);iCh=iso.to;}iScan=iso.to;}else if(iScan==to||(sameDir?types[iScan]!=ourType:types[iScan]==ourType)){break;}else{iScan++;}}if(recurse)emitSpans(line,iCh,iScan,level+1,baseLevel,recurse,order);else if(iCh<iScan)order.push(new BidiSpan(iCh,iScan,localLevel));iCh=iScan;}}else{// Iterate in reverse to flip the span order. Same code again, but
// going from the back of the section to the front
for(let iCh=to,iI=isolates.length;iCh>from;){let sameDir=true,isNum=false;if(!iI||iCh>isolates[iI-1].to){let next=types[iCh-1];if(next!=ourType){sameDir=false;isNum=next==16/* T.AN */;}}let recurse=!sameDir&&ourType==1/* T.L */?[]:null;let localLevel=sameDir?level:level+1;let iScan=iCh;run:for(;;){if(iI&&iScan==isolates[iI-1].to){if(isNum)break run;let iso=isolates[--iI];// Scan ahead to verify that there is another char in this dir after the isolate(s)
if(!sameDir)for(let upto=iso.from,jI=iI;;){if(upto==from)break run;if(jI&&isolates[jI-1].to==upto)upto=isolates[--jI].from;else if(types[upto-1]==ourType)break run;else break;}if(recurse){recurse.push(iso);}else{if(iso.to<iCh)order.push(new BidiSpan(iso.to,iCh,localLevel));let dirSwap=iso.direction==LTR!=!(localLevel%2);computeSectionOrder(line,dirSwap?level+1:level,baseLevel,iso.inner,iso.from,iso.to,order);iCh=iso.from;}iScan=iso.from;}else if(iScan==from||(sameDir?types[iScan-1]!=ourType:types[iScan-1]==ourType)){break;}else{iScan--;}}if(recurse)emitSpans(line,iScan,iCh,level+1,baseLevel,recurse,order);else if(iScan<iCh)order.push(new BidiSpan(iScan,iCh,localLevel));iCh=iScan;}}}function computeSectionOrder(line,level,baseLevel,isolates,from,to,order){let outerType=level%2?2/* T.R */:1/* T.L */;computeCharTypes(line,from,to,isolates,outerType);processBracketPairs(line,from,to,isolates,outerType);processNeutrals(from,to,isolates,outerType);emitSpans(line,from,to,level,baseLevel,isolates,order);}function computeOrder(line,direction,isolates){if(!line)return[new BidiSpan(0,0,direction==RTL?1:0)];if(direction==LTR&&!isolates.length&&!BidiRE.test(line))return trivialOrder(line.length);if(isolates.length)while(line.length>types.length)types[types.length]=256/* T.NI */;// Make sure types array has no gaps
let order=[],level=direction==LTR?0:1;computeSectionOrder(line,level,level,isolates,0,line.length,order);return order;}function trivialOrder(length){return[new BidiSpan(0,length,0)];}let movedOver="";// This implementation moves strictly visually, without concern for a
// traversal visiting every logical position in the string. It will
// still do so for simple input, but situations like multiple isolates
// with the same level next to each other, or text going against the
// main dir at the end of the line, will make some positions
// unreachable with this motion. Each visible cursor position will
// correspond to the lower-level bidi span that touches it.
//
// The alternative would be to solve an order globally for a given
// line, making sure that it includes every position, but that would
// require associating non-canonical (higher bidi span level)
// positions with a given visual position, which is likely to confuse
// people. (And would generally be a lot more complicated.)
function moveVisually(line,order,dir,start,forward){var _a;let startIndex=start.head-line.from;let spanI=BidiSpan.find(order,startIndex,(_a=start.bidiLevel)!==null&&_a!==void 0?_a:-1,start.assoc);let span=order[spanI],spanEnd=span.side(forward,dir);// End of span
if(startIndex==spanEnd){let nextI=spanI+=forward?1:-1;if(nextI<0||nextI>=order.length)return null;span=order[spanI=nextI];startIndex=span.side(!forward,dir);spanEnd=span.side(forward,dir);}let nextIndex=findClusterBreak(line.text,startIndex,span.forward(forward,dir));if(nextIndex<span.from||nextIndex>span.to)nextIndex=spanEnd;movedOver=line.text.slice(Math.min(startIndex,nextIndex),Math.max(startIndex,nextIndex));let nextSpan=spanI==(forward?order.length-1:0)?null:order[spanI+(forward?1:-1)];if(nextSpan&&nextIndex==spanEnd&&nextSpan.level+(forward?0:1)<span.level)return EditorSelection.cursor(nextSpan.side(!forward,dir)+line.from,nextSpan.forward(forward,dir)?1:-1,nextSpan.level);return EditorSelection.cursor(nextIndex+line.from,span.forward(forward,dir)?-1:1,span.level);}function autoDirection(text,from,to){for(let i=from;i<to;i++){let type=charType(text.charCodeAt(i));if(type==1/* T.L */)return LTR;if(type==2/* T.R */||type==4/* T.AL */)return RTL;}return LTR;}const clickAddsSelectionRange=/*@__PURE__*/Facet.define();const dragMovesSelection$1=/*@__PURE__*/Facet.define();const mouseSelectionStyle=/*@__PURE__*/Facet.define();const exceptionSink=/*@__PURE__*/Facet.define();const updateListener=/*@__PURE__*/Facet.define();const inputHandler$1=/*@__PURE__*/Facet.define();const focusChangeEffect=/*@__PURE__*/Facet.define();const perLineTextDirection=/*@__PURE__*/Facet.define({combine:values=>values.some(x=>x)});const nativeSelectionHidden=/*@__PURE__*/Facet.define({combine:values=>values.some(x=>x)});class ScrollTarget{constructor(range,y="nearest",x="nearest",yMargin=5,xMargin=5,// This data structure is abused to also store precise scroll
// snapshots, instead of a `scrollIntoView` request. When this
// flag is `true`, `range` points at a position in the reference
// line, `yMargin` holds the difference between the top of that
// line and the top of the editor, and `xMargin` holds the
// editor's `scrollLeft`.
isSnapshot=false){this.range=range;this.y=y;this.x=x;this.yMargin=yMargin;this.xMargin=xMargin;this.isSnapshot=isSnapshot;}map(changes){return changes.empty?this:new ScrollTarget(this.range.map(changes),this.y,this.x,this.yMargin,this.xMargin,this.isSnapshot);}clip(state){return this.range.to<=state.doc.length?this:new ScrollTarget(EditorSelection.cursor(state.doc.length),this.y,this.x,this.yMargin,this.xMargin,this.isSnapshot);}}const scrollIntoView$1=/*@__PURE__*/StateEffect.define({map:(t,ch)=>t.map(ch)});/**
  Log or report an unhandled exception in client code. Should
  probably only be used by extension code that allows client code to
  provide functions, and calls those functions in a context where an
  exception can't be propagated to calling code in a reasonable way
  (for example when in an event handler).

  Either calls a handler registered with
  [`EditorView.exceptionSink`](https://codemirror.net/6/docs/ref/#view.EditorView^exceptionSink),
  `window.onerror`, if defined, or `console.error` (in which case
  it'll pass `context`, when given, as first argument).
  */function logException(state,exception,context){let handler=state.facet(exceptionSink);if(handler.length)handler[0](exception);else if(window.onerror)window.onerror(String(exception),context,undefined,undefined,exception);else if(context)void 0;else void 0;}const editable=/*@__PURE__*/Facet.define({combine:values=>values.length?values[0]:true});let nextPluginID=0;const viewPlugin=/*@__PURE__*/Facet.define();/**
  View plugins associate stateful values with a view. They can
  influence the way the content is drawn, and are notified of things
  that happen in the view.
  */class ViewPlugin{constructor(/**
      @internal
      */id,/**
      @internal
      */create,/**
      @internal
      */domEventHandlers,/**
      @internal
      */domEventObservers,buildExtensions){this.id=id;this.create=create;this.domEventHandlers=domEventHandlers;this.domEventObservers=domEventObservers;this.extension=buildExtensions(this);}/**
      Define a plugin from a constructor function that creates the
      plugin's value, given an editor view.
      */static define(create,spec){const{eventHandlers,eventObservers,provide,decorations:deco}=spec||{};return new ViewPlugin(nextPluginID++,create,eventHandlers,eventObservers,plugin=>{let ext=[viewPlugin.of(plugin)];if(deco)ext.push(decorations.of(view=>{let pluginInst=view.plugin(plugin);return pluginInst?deco(pluginInst):Decoration.none;}));if(provide)ext.push(provide(plugin));return ext;});}/**
      Create a plugin for a class whose constructor takes a single
      editor view as argument.
      */static fromClass(cls,spec){return ViewPlugin.define(view=>new cls(view),spec);}}class PluginInstance{constructor(spec){this.spec=spec;// When starting an update, all plugins have this field set to the
// update object, indicating they need to be updated. When finished
// updating, it is set to `false`. Retrieving a plugin that needs to
// be updated with `view.plugin` forces an eager update.
this.mustUpdate=null;// This is null when the plugin is initially created, but
// initialized on the first update.
this.value=null;}update(view){if(!this.value){if(this.spec){try{this.value=this.spec.create(view);}catch(e){logException(view.state,e,"CodeMirror plugin crashed");this.deactivate();}}}else if(this.mustUpdate){let update=this.mustUpdate;this.mustUpdate=null;if(this.value.update){try{this.value.update(update);}catch(e){logException(update.state,e,"CodeMirror plugin crashed");if(this.value.destroy)try{this.value.destroy();}catch(_){}this.deactivate();}}}return this;}destroy(view){var _a;if((_a=this.value)===null||_a===void 0?void 0:_a.destroy){try{this.value.destroy();}catch(e){logException(view.state,e,"CodeMirror plugin crashed");}}}deactivate(){this.spec=this.value=null;}}const editorAttributes=/*@__PURE__*/Facet.define();const contentAttributes=/*@__PURE__*/Facet.define();// Provide decorations
const decorations=/*@__PURE__*/Facet.define();const outerDecorations=/*@__PURE__*/Facet.define();const atomicRanges=/*@__PURE__*/Facet.define();const bidiIsolatedRanges=/*@__PURE__*/Facet.define();function getIsolatedRanges(view,line){let isolates=view.state.facet(bidiIsolatedRanges);if(!isolates.length)return isolates;let sets=isolates.map(i=>i instanceof Function?i(view):i);let result=[];RangeSet.spans(sets,line.from,line.to,{point(){},span(fromDoc,toDoc,active,open){let from=fromDoc-line.from,to=toDoc-line.from;let level=result;for(let i=active.length-1;i>=0;i--,open--){let direction=active[i].spec.bidiIsolate,update;if(direction==null)direction=autoDirection(line.text,from,to);if(open>0&&level.length&&(update=level[level.length-1]).to==from&&update.direction==direction){update.to=to;level=update.inner;}else{let add={from,to,direction,inner:[]};level.push(add);level=add.inner;}}}});return result;}const scrollMargins=/*@__PURE__*/Facet.define();function getScrollMargins(view){let left=0,right=0,top=0,bottom=0;for(let source of view.state.facet(scrollMargins)){let m=source(view);if(m){if(m.left!=null)left=Math.max(left,m.left);if(m.right!=null)right=Math.max(right,m.right);if(m.top!=null)top=Math.max(top,m.top);if(m.bottom!=null)bottom=Math.max(bottom,m.bottom);}}return{left,right,top,bottom};}const styleModule=/*@__PURE__*/Facet.define();class ChangedRange{constructor(fromA,toA,fromB,toB){this.fromA=fromA;this.toA=toA;this.fromB=fromB;this.toB=toB;}join(other){return new ChangedRange(Math.min(this.fromA,other.fromA),Math.max(this.toA,other.toA),Math.min(this.fromB,other.fromB),Math.max(this.toB,other.toB));}addToSet(set){let i=set.length,me=this;for(;i>0;i--){let range=set[i-1];if(range.fromA>me.toA)continue;if(range.toA<me.fromA)break;me=me.join(range);set.splice(i-1,1);}set.splice(i,0,me);return set;}static extendWithRanges(diff,ranges){if(ranges.length==0)return diff;let result=[];for(let dI=0,rI=0,posA=0,posB=0;;dI++){let next=dI==diff.length?null:diff[dI],off=posA-posB;let end=next?next.fromB:1e9;while(rI<ranges.length&&ranges[rI]<end){let from=ranges[rI],to=ranges[rI+1];let fromB=Math.max(posB,from),toB=Math.min(end,to);if(fromB<=toB)new ChangedRange(fromB+off,toB+off,fromB,toB).addToSet(result);if(to>end)break;else rI+=2;}if(!next)return result;new ChangedRange(next.fromA,next.toA,next.fromB,next.toB).addToSet(result);posA=next.toA;posB=next.toB;}}}/**
  View [plugins](https://codemirror.net/6/docs/ref/#view.ViewPlugin) are given instances of this
  class, which describe what happened, whenever the view is updated.
  */class ViewUpdate{constructor(/**
      The editor view that the update is associated with.
      */view,/**
      The new editor state.
      */state,/**
      The transactions involved in the update. May be empty.
      */transactions){this.view=view;this.state=state;this.transactions=transactions;/**
          @internal
          */this.flags=0;this.startState=view.state;this.changes=ChangeSet.empty(this.startState.doc.length);for(let tr of transactions)this.changes=this.changes.compose(tr.changes);let changedRanges=[];this.changes.iterChangedRanges((fromA,toA,fromB,toB)=>changedRanges.push(new ChangedRange(fromA,toA,fromB,toB)));this.changedRanges=changedRanges;}/**
      @internal
      */static create(view,state,transactions){return new ViewUpdate(view,state,transactions);}/**
      Tells you whether the [viewport](https://codemirror.net/6/docs/ref/#view.EditorView.viewport) or
      [visible ranges](https://codemirror.net/6/docs/ref/#view.EditorView.visibleRanges) changed in this
      update.
      */get viewportChanged(){return(this.flags&4/* UpdateFlag.Viewport */)>0;}/**
      Indicates whether the height of a block element in the editor
      changed in this update.
      */get heightChanged(){return(this.flags&2/* UpdateFlag.Height */)>0;}/**
      Returns true when the document was modified or the size of the
      editor, or elements within the editor, changed.
      */get geometryChanged(){return this.docChanged||(this.flags&(8/* UpdateFlag.Geometry */|2/* UpdateFlag.Height */))>0;}/**
      True when this update indicates a focus change.
      */get focusChanged(){return(this.flags&1/* UpdateFlag.Focus */)>0;}/**
      Whether the document changed in this update.
      */get docChanged(){return!this.changes.empty;}/**
      Whether the selection was explicitly set in this update.
      */get selectionSet(){return this.transactions.some(tr=>tr.selection);}/**
      @internal
      */get empty(){return this.flags==0&&this.transactions.length==0;}}class DocView extends ContentView{get length(){return this.view.state.doc.length;}constructor(view){super();this.view=view;this.decorations=[];this.dynamicDecorationMap=[false];this.domChanged=null;this.hasComposition=null;this.markedForComposition=new Set();this.compositionBarrier=Decoration.none;// Track a minimum width for the editor. When measuring sizes in
// measureVisibleLineHeights, this is updated to point at the width
// of a given element and its extent in the document. When a change
// happens in that range, these are reset. That way, once we've seen
// a line/element of a given length, we keep the editor wide enough
// to fit at least that element, until it is changed, at which point
// we forget it again.
this.minWidth=0;this.minWidthFrom=0;this.minWidthTo=0;// Track whether the DOM selection was set in a lossy way, so that
// we don't mess it up when reading it back it
this.impreciseAnchor=null;this.impreciseHead=null;this.forceSelection=false;// Used by the resize observer to ignore resizes that we caused
// ourselves
this.lastUpdate=Date.now();this.setDOM(view.contentDOM);this.children=[new LineView()];this.children[0].setParent(this);this.updateDeco();this.updateInner([new ChangedRange(0,0,0,view.state.doc.length)],0,null);}// Update the document view to a given state.
update(update){var _a;let changedRanges=update.changedRanges;if(this.minWidth>0&&changedRanges.length){if(!changedRanges.every(({fromA,toA})=>toA<this.minWidthFrom||fromA>this.minWidthTo)){this.minWidth=this.minWidthFrom=this.minWidthTo=0;}else{this.minWidthFrom=update.changes.mapPos(this.minWidthFrom,1);this.minWidthTo=update.changes.mapPos(this.minWidthTo,1);}}let readCompositionAt=-1;if(this.view.inputState.composing>=0){if((_a=this.domChanged)===null||_a===void 0?void 0:_a.newSel)readCompositionAt=this.domChanged.newSel.head;else if(!touchesComposition(update.changes,this.hasComposition)&&!update.selectionSet)readCompositionAt=update.state.selection.main.head;}let composition=readCompositionAt>-1?findCompositionRange(this.view,update.changes,readCompositionAt):null;this.domChanged=null;if(this.hasComposition){this.markedForComposition.clear();let{from,to}=this.hasComposition;changedRanges=new ChangedRange(from,to,update.changes.mapPos(from,-1),update.changes.mapPos(to,1)).addToSet(changedRanges.slice());}this.hasComposition=composition?{from:composition.range.fromB,to:composition.range.toB}:null;// When the DOM nodes around the selection are moved to another
// parent, Chrome sometimes reports a different selection through
// getSelection than the one that it actually shows to the user.
// This forces a selection update when lines are joined to work
// around that. Issue #54
if((browser.ie||browser.chrome)&&!composition&&update&&update.state.doc.lines!=update.startState.doc.lines)this.forceSelection=true;let prevDeco=this.decorations,deco=this.updateDeco();let decoDiff=findChangedDeco(prevDeco,deco,update.changes);changedRanges=ChangedRange.extendWithRanges(changedRanges,decoDiff);if(!(this.flags&7/* ViewFlag.Dirty */)&&changedRanges.length==0){return false;}else{this.updateInner(changedRanges,update.startState.doc.length,composition);if(update.transactions.length)this.lastUpdate=Date.now();return true;}}// Used by update and the constructor do perform the actual DOM
// update
updateInner(changes,oldLength,composition){this.view.viewState.mustMeasureContent=true;this.updateChildren(changes,oldLength,composition);let{observer}=this.view;observer.ignore(()=>{// Lock the height during redrawing, since Chrome sometimes
// messes with the scroll position during DOM mutation (though
// no relayout is triggered and I cannot imagine how it can
// recompute the scroll position without a layout)
this.dom.style.height=this.view.viewState.contentHeight/this.view.scaleY+"px";this.dom.style.flexBasis=this.minWidth?this.minWidth+"px":"";// Chrome will sometimes, when DOM mutations occur directly
// around the selection, get confused and report a different
// selection from the one it displays (issue #218). This tries
// to detect that situation.
let track=browser.chrome||browser.ios?{node:observer.selectionRange.focusNode,written:false}:undefined;this.sync(this.view,track);this.flags&=-8/* ViewFlag.Dirty */;if(track&&(track.written||observer.selectionRange.focusNode!=track.node))this.forceSelection=true;this.dom.style.height="";});this.markedForComposition.forEach(cView=>cView.flags&=-9/* ViewFlag.Composition */);let gaps=[];if(this.view.viewport.from||this.view.viewport.to<this.view.state.doc.length)for(let child of this.children)if(child instanceof BlockWidgetView&&child.widget instanceof BlockGapWidget)gaps.push(child.dom);observer.updateGaps(gaps);}updateChildren(changes,oldLength,composition){let ranges=composition?composition.range.addToSet(changes.slice()):changes;let cursor=this.childCursor(oldLength);for(let i=ranges.length-1;;i--){let next=i>=0?ranges[i]:null;if(!next)break;let{fromA,toA,fromB,toB}=next,content,breakAtStart,openStart,openEnd;if(composition&&composition.range.fromB<toB&&composition.range.toB>fromB){let before=ContentBuilder.build(this.view.state.doc,fromB,composition.range.fromB,this.decorations,this.dynamicDecorationMap);let after=ContentBuilder.build(this.view.state.doc,composition.range.toB,toB,this.decorations,this.dynamicDecorationMap);breakAtStart=before.breakAtStart;openStart=before.openStart;openEnd=after.openEnd;let compLine=this.compositionView(composition);if(after.breakAtStart){compLine.breakAfter=1;}else if(after.content.length&&compLine.merge(compLine.length,compLine.length,after.content[0],false,after.openStart,0)){compLine.breakAfter=after.content[0].breakAfter;after.content.shift();}if(before.content.length&&compLine.merge(0,0,before.content[before.content.length-1],true,0,before.openEnd)){before.content.pop();}content=before.content.concat(compLine).concat(after.content);}else{({content,breakAtStart,openStart,openEnd}=ContentBuilder.build(this.view.state.doc,fromB,toB,this.decorations,this.dynamicDecorationMap));}let{i:toI,off:toOff}=cursor.findPos(toA,1);let{i:fromI,off:fromOff}=cursor.findPos(fromA,-1);replaceRange(this,fromI,fromOff,toI,toOff,content,breakAtStart,openStart,openEnd);}if(composition)this.fixCompositionDOM(composition);}compositionView(composition){let cur=new TextView(composition.text.nodeValue);cur.flags|=8/* ViewFlag.Composition */;for(let{deco}of composition.marks)cur=new MarkView(deco,[cur],cur.length);let line=new LineView();line.append(cur,0);return line;}fixCompositionDOM(composition){let fix=(dom,cView)=>{cView.flags|=8/* ViewFlag.Composition */|(cView.children.some(c=>c.flags&7/* ViewFlag.Dirty */)?1/* ViewFlag.ChildDirty */:0);this.markedForComposition.add(cView);let prev=ContentView.get(dom);if(prev&&prev!=cView)prev.dom=null;cView.setDOM(dom);};let pos=this.childPos(composition.range.fromB,1);let cView=this.children[pos.i];fix(composition.line,cView);for(let i=composition.marks.length-1;i>=-1;i--){pos=cView.childPos(pos.off,1);cView=cView.children[pos.i];fix(i>=0?composition.marks[i].node:composition.text,cView);}}// Sync the DOM selection to this.state.selection
updateSelection(mustRead=false,fromPointer=false){if(mustRead||!this.view.observer.selectionRange.focusNode)this.view.observer.readSelectionRange();let activeElt=this.view.root.activeElement,focused=activeElt==this.dom;let selectionNotFocus=!focused&&hasSelection(this.dom,this.view.observer.selectionRange)&&!(activeElt&&this.dom.contains(activeElt));if(!(focused||fromPointer||selectionNotFocus))return;let force=this.forceSelection;this.forceSelection=false;let main=this.view.state.selection.main;let anchor=this.moveToLine(this.domAtPos(main.anchor));let head=main.empty?anchor:this.moveToLine(this.domAtPos(main.head));// Always reset on Firefox when next to an uneditable node to
// avoid invisible cursor bugs (#111)
if(browser.gecko&&main.empty&&!this.hasComposition&&betweenUneditable(anchor)){let dummy=document.createTextNode("");this.view.observer.ignore(()=>anchor.node.insertBefore(dummy,anchor.node.childNodes[anchor.offset]||null));anchor=head=new DOMPos(dummy,0);force=true;}let domSel=this.view.observer.selectionRange;// If the selection is already here, or in an equivalent position, don't touch it
if(force||!domSel.focusNode||(!isEquivalentPosition(anchor.node,anchor.offset,domSel.anchorNode,domSel.anchorOffset)||!isEquivalentPosition(head.node,head.offset,domSel.focusNode,domSel.focusOffset))&&!this.suppressWidgetCursorChange(domSel,main)){this.view.observer.ignore(()=>{// Chrome Android will hide the virtual keyboard when tapping
// inside an uneditable node, and not bring it back when we
// move the cursor to its proper position. This tries to
// restore the keyboard by cycling focus.
if(browser.android&&browser.chrome&&this.dom.contains(domSel.focusNode)&&inUneditable(domSel.focusNode,this.dom)){this.dom.blur();this.dom.focus({preventScroll:true});}let rawSel=getSelection(this.view.root);if(!rawSel);else if(main.empty){// Work around https://bugzilla.mozilla.org/show_bug.cgi?id=1612076
if(browser.gecko){let nextTo=nextToUneditable(anchor.node,anchor.offset);if(nextTo&&nextTo!=(1/* NextTo.Before */|2/* NextTo.After */)){let text=nearbyTextNode(anchor.node,anchor.offset,nextTo==1/* NextTo.Before */?1:-1);if(text)anchor=new DOMPos(text.node,text.offset);}}rawSel.collapse(anchor.node,anchor.offset);if(main.bidiLevel!=null&&rawSel.caretBidiLevel!==undefined)rawSel.caretBidiLevel=main.bidiLevel;}else if(rawSel.extend){// Selection.extend can be used to create an 'inverted' selection
// (one where the focus is before the anchor), but not all
// browsers support it yet.
rawSel.collapse(anchor.node,anchor.offset);// Safari will ignore the call above when the editor is
// hidden, and then raise an error on the call to extend
// (#940).
try{rawSel.extend(head.node,head.offset);}catch(_){}}else{// Primitive (IE) way
let range=document.createRange();if(main.anchor>main.head)[anchor,head]=[head,anchor];range.setEnd(head.node,head.offset);range.setStart(anchor.node,anchor.offset);rawSel.removeAllRanges();rawSel.addRange(range);}if(selectionNotFocus&&this.view.root.activeElement==this.dom){this.dom.blur();if(activeElt)activeElt.focus();}});this.view.observer.setSelectionRange(anchor,head);}this.impreciseAnchor=anchor.precise?null:new DOMPos(domSel.anchorNode,domSel.anchorOffset);this.impreciseHead=head.precise?null:new DOMPos(domSel.focusNode,domSel.focusOffset);}// If a zero-length widget is inserted next to the cursor during
// composition, avoid moving it across it and disrupting the
// composition.
suppressWidgetCursorChange(sel,cursor){return this.hasComposition&&cursor.empty&&!this.compositionBarrier.size&&isEquivalentPosition(sel.focusNode,sel.focusOffset,sel.anchorNode,sel.anchorOffset)&&this.posFromDOM(sel.focusNode,sel.focusOffset)==cursor.head;}enforceCursorAssoc(){if(this.hasComposition)return;let{view}=this,cursor=view.state.selection.main;let sel=getSelection(view.root);let{anchorNode,anchorOffset}=view.observer.selectionRange;if(!sel||!cursor.empty||!cursor.assoc||!sel.modify)return;let line=LineView.find(this,cursor.head);if(!line)return;let lineStart=line.posAtStart;if(cursor.head==lineStart||cursor.head==lineStart+line.length)return;let before=this.coordsAt(cursor.head,-1),after=this.coordsAt(cursor.head,1);if(!before||!after||before.bottom>after.top)return;let dom=this.domAtPos(cursor.head+cursor.assoc);sel.collapse(dom.node,dom.offset);sel.modify("move",cursor.assoc<0?"forward":"backward","lineboundary");// This can go wrong in corner cases like single-character lines,
// so check and reset if necessary.
view.observer.readSelectionRange();let newRange=view.observer.selectionRange;if(view.docView.posFromDOM(newRange.anchorNode,newRange.anchorOffset)!=cursor.from)sel.collapse(anchorNode,anchorOffset);}// If a position is in/near a block widget, move it to a nearby text
// line, since we don't want the cursor inside a block widget.
moveToLine(pos){// Block widgets will return positions before/after them, which
// are thus directly in the document DOM element.
let dom=this.dom,newPos;if(pos.node!=dom)return pos;for(let i=pos.offset;!newPos&&i<dom.childNodes.length;i++){let view=ContentView.get(dom.childNodes[i]);if(view instanceof LineView)newPos=view.domAtPos(0);}for(let i=pos.offset-1;!newPos&&i>=0;i--){let view=ContentView.get(dom.childNodes[i]);if(view instanceof LineView)newPos=view.domAtPos(view.length);}return newPos?new DOMPos(newPos.node,newPos.offset,true):pos;}nearest(dom){for(let cur=dom;cur;){let domView=ContentView.get(cur);if(domView&&domView.rootView==this)return domView;cur=cur.parentNode;}return null;}posFromDOM(node,offset){let view=this.nearest(node);if(!view)throw new RangeError("Trying to find position for a DOM position outside of the document");return view.localPosFromDOM(node,offset)+view.posAtStart;}domAtPos(pos){let{i,off}=this.childCursor().findPos(pos,-1);for(;i<this.children.length-1;){let child=this.children[i];if(off<child.length||child instanceof LineView)break;i++;off=0;}return this.children[i].domAtPos(off);}coordsAt(pos,side){let best=null,bestPos=0;for(let off=this.length,i=this.children.length-1;i>=0;i--){let child=this.children[i],end=off-child.breakAfter,start=end-child.length;if(end<pos)break;if(start<=pos&&(start<pos||child.covers(-1))&&(end>pos||child.covers(1))&&(!best||child instanceof LineView&&!(best instanceof LineView&&side>=0))){best=child;bestPos=start;}off=start;}return best?best.coordsAt(pos-bestPos,side):null;}coordsForChar(pos){let{i,off}=this.childPos(pos,1),child=this.children[i];if(!(child instanceof LineView))return null;while(child.children.length){let{i,off:childOff}=child.childPos(off,1);for(;;i++){if(i==child.children.length)return null;if((child=child.children[i]).length)break;}off=childOff;}if(!(child instanceof TextView))return null;let end=findClusterBreak(child.text,off);if(end==off)return null;let rects=textRange(child.dom,off,end).getClientRects();for(let i=0;i<rects.length;i++){let rect=rects[i];if(i==rects.length-1||rect.top<rect.bottom&&rect.left<rect.right)return rect;}return null;}measureVisibleLineHeights(viewport){let result=[],{from,to}=viewport;let contentWidth=this.view.contentDOM.clientWidth;let isWider=contentWidth>Math.max(this.view.scrollDOM.clientWidth,this.minWidth)+1;let widest=-1,ltr=this.view.textDirection==Direction.LTR;for(let pos=0,i=0;i<this.children.length;i++){let child=this.children[i],end=pos+child.length;if(end>to)break;if(pos>=from){let childRect=child.dom.getBoundingClientRect();result.push(childRect.height);if(isWider){let last=child.dom.lastChild;let rects=last?clientRectsFor(last):[];if(rects.length){let rect=rects[rects.length-1];let width=ltr?rect.right-childRect.left:childRect.right-rect.left;if(width>widest){widest=width;this.minWidth=contentWidth;this.minWidthFrom=pos;this.minWidthTo=end;}}}}pos=end+child.breakAfter;}return result;}textDirectionAt(pos){let{i}=this.childPos(pos,1);return getComputedStyle(this.children[i].dom).direction=="rtl"?Direction.RTL:Direction.LTR;}measureTextSize(){for(let child of this.children){if(child instanceof LineView){let measure=child.measureTextSize();if(measure)return measure;}}// If no workable line exists, force a layout of a measurable element
let dummy=document.createElement("div"),lineHeight,charWidth,textHeight;dummy.className="cm-line";dummy.style.width="99999px";dummy.style.position="absolute";dummy.textContent="abc def ghi jkl mno pqr stu";this.view.observer.ignore(()=>{this.dom.appendChild(dummy);let rect=clientRectsFor(dummy.firstChild)[0];lineHeight=dummy.getBoundingClientRect().height;charWidth=rect?rect.width/27:7;textHeight=rect?rect.height:lineHeight;dummy.remove();});return{lineHeight,charWidth,textHeight};}childCursor(pos=this.length){// Move back to start of last element when possible, so that
// `ChildCursor.findPos` doesn't have to deal with the edge case
// of being after the last element.
let i=this.children.length;if(i)pos-=this.children[--i].length;return new ChildCursor(this.children,pos,i);}computeBlockGapDeco(){let deco=[],vs=this.view.viewState;for(let pos=0,i=0;;i++){let next=i==vs.viewports.length?null:vs.viewports[i];let end=next?next.from-1:this.length;if(end>pos){let height=(vs.lineBlockAt(end).bottom-vs.lineBlockAt(pos).top)/this.view.scaleY;deco.push(Decoration.replace({widget:new BlockGapWidget(height),block:true,inclusive:true,isBlockGap:true}).range(pos,end));}if(!next)break;pos=next.to+1;}return Decoration.set(deco);}updateDeco(){let i=1;let allDeco=this.view.state.facet(decorations).map(d=>{let dynamic=this.dynamicDecorationMap[i++]=typeof d=="function";return dynamic?d(this.view):d;});let dynamicOuter=false,outerDeco=this.view.state.facet(outerDecorations).map((d,i)=>{let dynamic=typeof d=="function";if(dynamic)dynamicOuter=true;return dynamic?d(this.view):d;});if(outerDeco.length){this.dynamicDecorationMap[i++]=dynamicOuter;allDeco.push(RangeSet.join(outerDeco));}this.decorations=[this.compositionBarrier,...allDeco,this.computeBlockGapDeco(),this.view.viewState.lineGapDeco];while(i<this.decorations.length)this.dynamicDecorationMap[i++]=false;return this.decorations;}// Starting a composition will style the inserted text with the
// style of the text before it, and this is only cleared when the
// composition ends, because touching it before that will abort it.
// This (called from compositionstart handler) tries to notice when
// the cursor is after a non-inclusive mark, where the styling could
// be jarring, and insert an ad-hoc widget before the cursor to
// isolate it from the style before it.
maybeCreateCompositionBarrier(){let{main:{head,empty}}=this.view.state.selection;if(!empty)return false;let found=null;for(let set of this.decorations){set.between(head,head,(from,to,value)=>{if(value.point)found=false;else if(value.endSide<0&&from<head&&to==head)found=true;});if(found===false)break;}this.compositionBarrier=found?Decoration.set(compositionBarrierWidget.range(head)):Decoration.none;return!!found;}clearCompositionBarrier(){this.compositionBarrier=Decoration.none;}scrollIntoView(target){if(target.isSnapshot){let ref=this.view.viewState.lineBlockAt(target.range.head);this.view.scrollDOM.scrollTop=ref.top-target.yMargin;this.view.scrollDOM.scrollLeft=target.xMargin;return;}let{range}=target;let rect=this.coordsAt(range.head,range.empty?range.assoc:range.head>range.anchor?-1:1),other;if(!rect)return;if(!range.empty&&(other=this.coordsAt(range.anchor,range.anchor>range.head?-1:1)))rect={left:Math.min(rect.left,other.left),top:Math.min(rect.top,other.top),right:Math.max(rect.right,other.right),bottom:Math.max(rect.bottom,other.bottom)};let margins=getScrollMargins(this.view);let targetRect={left:rect.left-margins.left,top:rect.top-margins.top,right:rect.right+margins.right,bottom:rect.bottom+margins.bottom};let{offsetWidth,offsetHeight}=this.view.scrollDOM;scrollRectIntoView(this.view.scrollDOM,targetRect,range.head<range.anchor?-1:1,target.x,target.y,Math.max(Math.min(target.xMargin,offsetWidth),-offsetWidth),Math.max(Math.min(target.yMargin,offsetHeight),-offsetHeight),this.view.textDirection==Direction.LTR);}}const compositionBarrierWidget=/*@__PURE__*/Decoration.widget({side:-1,widget:NullWidget.inline});function betweenUneditable(pos){return pos.node.nodeType==1&&pos.node.firstChild&&(pos.offset==0||pos.node.childNodes[pos.offset-1].contentEditable=="false")&&(pos.offset==pos.node.childNodes.length||pos.node.childNodes[pos.offset].contentEditable=="false");}class BlockGapWidget extends WidgetType{constructor(height){super();this.height=height;}toDOM(){let elt=document.createElement("div");elt.className="cm-gap";this.updateDOM(elt);return elt;}eq(other){return other.height==this.height;}updateDOM(elt){elt.style.height=this.height+"px";return true;}get editable(){return true;}get estimatedHeight(){return this.height;}ignoreEvent(){return false;}}function findCompositionNode(view,headPos){let sel=view.observer.selectionRange;let textNode=sel.focusNode&&nearbyTextNode(sel.focusNode,sel.focusOffset,0);if(!textNode)return null;let from=headPos-textNode.offset;return{from,to:from+textNode.node.nodeValue.length,node:textNode.node};}function findCompositionRange(view,changes,headPos){let found=findCompositionNode(view,headPos);if(!found)return null;let{node:textNode,from,to}=found,text=textNode.nodeValue;// Don't try to preserve multi-line compositions
if(/[\n\r]/.test(text))return null;if(view.state.doc.sliceString(found.from,found.to)!=text)return null;let inv=changes.invertedDesc;let range=new ChangedRange(inv.mapPos(from),inv.mapPos(to),from,to);let marks=[];for(let parent=textNode.parentNode;;parent=parent.parentNode){let parentView=ContentView.get(parent);if(parentView instanceof MarkView)marks.push({node:parent,deco:parentView.mark});else if(parentView instanceof LineView||parent.nodeName=="DIV"&&parent.parentNode==view.contentDOM)return{range,text:textNode,marks,line:parent};else if(parent!=view.contentDOM)marks.push({node:parent,deco:new MarkDecoration({inclusive:true,attributes:getAttrs$1(parent),tagName:parent.tagName.toLowerCase()})});else return null;}}function nearbyTextNode(startNode,startOffset,side){if(side<=0)for(let node=startNode,offset=startOffset;;){if(node.nodeType==3)return{node:node,offset:offset};if(node.nodeType==1&&offset>0){node=node.childNodes[offset-1];offset=maxOffset(node);}else{break;}}if(side>=0)for(let node=startNode,offset=startOffset;;){if(node.nodeType==3)return{node:node,offset:offset};if(node.nodeType==1&&offset<node.childNodes.length&&side>=0){node=node.childNodes[offset];offset=0;}else{break;}}return null;}function nextToUneditable(node,offset){if(node.nodeType!=1)return 0;return(offset&&node.childNodes[offset-1].contentEditable=="false"?1/* NextTo.Before */:0)|(offset<node.childNodes.length&&node.childNodes[offset].contentEditable=="false"?2/* NextTo.After */:0);}let DecorationComparator$1=class DecorationComparator{constructor(){this.changes=[];}compareRange(from,to){addRange(from,to,this.changes);}comparePoint(from,to){addRange(from,to,this.changes);}};function findChangedDeco(a,b,diff){let comp=new DecorationComparator$1();RangeSet.compare(a,b,diff,comp);return comp.changes;}function inUneditable(node,inside){for(let cur=node;cur&&cur!=inside;cur=cur.assignedSlot||cur.parentNode){if(cur.nodeType==1&&cur.contentEditable=='false'){return true;}}return false;}function touchesComposition(changes,composition){let touched=false;if(composition)changes.iterChangedRanges((from,to)=>{if(from<composition.to&&to>composition.from)touched=true;});return touched;}function groupAt(state,pos,bias=1){let categorize=state.charCategorizer(pos);let line=state.doc.lineAt(pos),linePos=pos-line.from;if(line.length==0)return EditorSelection.cursor(pos);if(linePos==0)bias=1;else if(linePos==line.length)bias=-1;let from=linePos,to=linePos;if(bias<0)from=findClusterBreak(line.text,linePos,false);else to=findClusterBreak(line.text,linePos);let cat=categorize(line.text.slice(from,to));while(from>0){let prev=findClusterBreak(line.text,from,false);if(categorize(line.text.slice(prev,from))!=cat)break;from=prev;}while(to<line.length){let next=findClusterBreak(line.text,to);if(categorize(line.text.slice(to,next))!=cat)break;to=next;}return EditorSelection.range(from+line.from,to+line.from);}// Search the DOM for the {node, offset} position closest to the given
// coordinates. Very inefficient and crude, but can usually be avoided
// by calling caret(Position|Range)FromPoint instead.
function getdx(x,rect){return rect.left>x?rect.left-x:Math.max(0,x-rect.right);}function getdy(y,rect){return rect.top>y?rect.top-y:Math.max(0,y-rect.bottom);}function yOverlap(a,b){return a.top<b.bottom-1&&a.bottom>b.top+1;}function upTop(rect,top){return top<rect.top?{top,left:rect.left,right:rect.right,bottom:rect.bottom}:rect;}function upBot(rect,bottom){return bottom>rect.bottom?{top:rect.top,left:rect.left,right:rect.right,bottom}:rect;}function domPosAtCoords(parent,x,y){let closest,closestRect,closestX,closestY,closestOverlap=false;let above,below,aboveRect,belowRect;for(let child=parent.firstChild;child;child=child.nextSibling){let rects=clientRectsFor(child);for(let i=0;i<rects.length;i++){let rect=rects[i];if(closestRect&&yOverlap(closestRect,rect))rect=upTop(upBot(rect,closestRect.bottom),closestRect.top);let dx=getdx(x,rect),dy=getdy(y,rect);if(dx==0&&dy==0)return child.nodeType==3?domPosInText(child,x,y):domPosAtCoords(child,x,y);if(!closest||closestY>dy||closestY==dy&&closestX>dx){closest=child;closestRect=rect;closestX=dx;closestY=dy;let side=dy?y<rect.top?-1:1:dx?x<rect.left?-1:1:0;closestOverlap=!side||(side>0?i<rects.length-1:i>0);}if(dx==0){if(y>rect.bottom&&(!aboveRect||aboveRect.bottom<rect.bottom)){above=child;aboveRect=rect;}else if(y<rect.top&&(!belowRect||belowRect.top>rect.top)){below=child;belowRect=rect;}}else if(aboveRect&&yOverlap(aboveRect,rect)){aboveRect=upBot(aboveRect,rect.bottom);}else if(belowRect&&yOverlap(belowRect,rect)){belowRect=upTop(belowRect,rect.top);}}}if(aboveRect&&aboveRect.bottom>=y){closest=above;closestRect=aboveRect;}else if(belowRect&&belowRect.top<=y){closest=below;closestRect=belowRect;}if(!closest)return{node:parent,offset:0};let clipX=Math.max(closestRect.left,Math.min(closestRect.right,x));if(closest.nodeType==3)return domPosInText(closest,clipX,y);if(closestOverlap&&closest.contentEditable!="false")return domPosAtCoords(closest,clipX,y);let offset=Array.prototype.indexOf.call(parent.childNodes,closest)+(x>=(closestRect.left+closestRect.right)/2?1:0);return{node:parent,offset};}function domPosInText(node,x,y){let len=node.nodeValue.length;let closestOffset=-1,closestDY=1e9,generalSide=0;for(let i=0;i<len;i++){let rects=textRange(node,i,i+1).getClientRects();for(let j=0;j<rects.length;j++){let rect=rects[j];if(rect.top==rect.bottom)continue;if(!generalSide)generalSide=x-rect.left;let dy=(rect.top>y?rect.top-y:y-rect.bottom)-1;if(rect.left-1<=x&&rect.right+1>=x&&dy<closestDY){let right=x>=(rect.left+rect.right)/2,after=right;if(browser.chrome||browser.gecko){// Check for RTL on browsers that support getting client
// rects for empty ranges.
let rectBefore=textRange(node,i).getBoundingClientRect();if(rectBefore.left==rect.right)after=!right;}if(dy<=0)return{node,offset:i+(after?1:0)};closestOffset=i+(after?1:0);closestDY=dy;}}}return{node,offset:closestOffset>-1?closestOffset:generalSide>0?node.nodeValue.length:0};}function posAtCoords(view,coords,precise,bias=-1){var _a,_b;let content=view.contentDOM.getBoundingClientRect(),docTop=content.top+view.viewState.paddingTop;let block,{docHeight}=view.viewState;let{x,y}=coords,yOffset=y-docTop;if(yOffset<0)return 0;if(yOffset>docHeight)return view.state.doc.length;// Scan for a text block near the queried y position
for(let halfLine=view.viewState.heightOracle.textHeight/2,bounced=false;;){block=view.elementAtHeight(yOffset);if(block.type==BlockType.Text)break;for(;;){// Move the y position out of this block
yOffset=bias>0?block.bottom+halfLine:block.top-halfLine;if(yOffset>=0&&yOffset<=docHeight)break;// If the document consists entirely of replaced widgets, we
// won't find a text block, so return 0
if(bounced)return precise?null:0;bounced=true;bias=-bias;}}y=docTop+yOffset;let lineStart=block.from;// If this is outside of the rendered viewport, we can't determine a position
if(lineStart<view.viewport.from)return view.viewport.from==0?0:precise?null:posAtCoordsImprecise(view,content,block,x,y);if(lineStart>view.viewport.to)return view.viewport.to==view.state.doc.length?view.state.doc.length:precise?null:posAtCoordsImprecise(view,content,block,x,y);// Prefer ShadowRootOrDocument.elementFromPoint if present, fall back to document if not
let doc=view.dom.ownerDocument;let root=view.root.elementFromPoint?view.root:doc;let element=root.elementFromPoint(x,y);if(element&&!view.contentDOM.contains(element))element=null;// If the element is unexpected, clip x at the sides of the content area and try again
if(!element){x=Math.max(content.left+1,Math.min(content.right-1,x));element=root.elementFromPoint(x,y);if(element&&!view.contentDOM.contains(element))element=null;}// There's visible editor content under the point, so we can try
// using caret(Position|Range)FromPoint as a shortcut
let node,offset=-1;if(element&&((_a=view.docView.nearest(element))===null||_a===void 0?void 0:_a.isEditable)!=false){if(doc.caretPositionFromPoint){let pos=doc.caretPositionFromPoint(x,y);if(pos)({offsetNode:node,offset}=pos);}else if(doc.caretRangeFromPoint){let range=doc.caretRangeFromPoint(x,y);if(range){({startContainer:node,startOffset:offset}=range);if(!view.contentDOM.contains(node)||browser.safari&&isSuspiciousSafariCaretResult(node,offset,x)||browser.chrome&&isSuspiciousChromeCaretResult(node,offset,x))node=undefined;}}}// No luck, do our own (potentially expensive) search
if(!node||!view.docView.dom.contains(node)){let line=LineView.find(view.docView,lineStart);if(!line)return yOffset>block.top+block.height/2?block.to:block.from;({node,offset}=domPosAtCoords(line.dom,x,y));}let nearest=view.docView.nearest(node);if(!nearest)return null;if(nearest.isWidget&&((_b=nearest.dom)===null||_b===void 0?void 0:_b.nodeType)==1){let rect=nearest.dom.getBoundingClientRect();return coords.y<rect.top||coords.y<=rect.bottom&&coords.x<=(rect.left+rect.right)/2?nearest.posAtStart:nearest.posAtEnd;}else{return nearest.localPosFromDOM(node,offset)+nearest.posAtStart;}}function posAtCoordsImprecise(view,contentRect,block,x,y){let into=Math.round((x-contentRect.left)*view.defaultCharacterWidth);if(view.lineWrapping&&block.height>view.defaultLineHeight*1.5){let textHeight=view.viewState.heightOracle.textHeight;let line=Math.floor((y-block.top-(view.defaultLineHeight-textHeight)*0.5)/textHeight);into+=line*view.viewState.heightOracle.lineLength;}let content=view.state.sliceDoc(block.from,block.to);return block.from+findColumn(content,into,view.state.tabSize);}// In case of a high line height, Safari's caretRangeFromPoint treats
// the space between lines as belonging to the last character of the
// line before. This is used to detect such a result so that it can be
// ignored (issue #401).
function isSuspiciousSafariCaretResult(node,offset,x){let len;if(node.nodeType!=3||offset!=(len=node.nodeValue.length))return false;for(let next=node.nextSibling;next;next=next.nextSibling)if(next.nodeType!=1||next.nodeName!="BR")return false;return textRange(node,len-1,len).getBoundingClientRect().left>x;}// Chrome will move positions between lines to the start of the next line
function isSuspiciousChromeCaretResult(node,offset,x){if(offset!=0)return false;for(let cur=node;;){let parent=cur.parentNode;if(!parent||parent.nodeType!=1||parent.firstChild!=cur)return false;if(parent.classList.contains("cm-line"))break;cur=parent;}let rect=node.nodeType==1?node.getBoundingClientRect():textRange(node,0,Math.max(node.nodeValue.length,1)).getBoundingClientRect();return x-rect.left>5;}function blockAt(view,pos){let line=view.lineBlockAt(pos);if(Array.isArray(line.type))for(let l of line.type){if(l.to>pos||l.to==pos&&(l.to==line.to||l.type==BlockType.Text))return l;}return line;}function moveToLineBoundary(view,start,forward,includeWrap){let line=blockAt(view,start.head);let coords=!includeWrap||line.type!=BlockType.Text||!(view.lineWrapping||line.widgetLineBreaks)?null:view.coordsAtPos(start.assoc<0&&start.head>line.from?start.head-1:start.head);if(coords){let editorRect=view.dom.getBoundingClientRect();let direction=view.textDirectionAt(line.from);let pos=view.posAtCoords({x:forward==(direction==Direction.LTR)?editorRect.right-1:editorRect.left+1,y:(coords.top+coords.bottom)/2});if(pos!=null)return EditorSelection.cursor(pos,forward?-1:1);}return EditorSelection.cursor(forward?line.to:line.from,forward?-1:1);}function moveByChar(view,start,forward,by){let line=view.state.doc.lineAt(start.head),spans=view.bidiSpans(line);let direction=view.textDirectionAt(line.from);for(let cur=start,check=null;;){let next=moveVisually(line,spans,direction,cur,forward),char=movedOver;if(!next){if(line.number==(forward?view.state.doc.lines:1))return cur;char="\n";line=view.state.doc.line(line.number+(forward?1:-1));spans=view.bidiSpans(line);next=view.visualLineSide(line,!forward);}if(!check){if(!by)return next;check=by(char);}else if(!check(char)){return cur;}cur=next;}}function byGroup(view,pos,start){let categorize=view.state.charCategorizer(pos);let cat=categorize(start);return next=>{let nextCat=categorize(next);if(cat==CharCategory.Space)cat=nextCat;return cat==nextCat;};}function moveVertically(view,start,forward,distance){let startPos=start.head,dir=forward?1:-1;if(startPos==(forward?view.state.doc.length:0))return EditorSelection.cursor(startPos,start.assoc);let goal=start.goalColumn,startY;let rect=view.contentDOM.getBoundingClientRect();let startCoords=view.coordsAtPos(startPos,start.assoc||-1),docTop=view.documentTop;if(startCoords){if(goal==null)goal=startCoords.left-rect.left;startY=dir<0?startCoords.top:startCoords.bottom;}else{let line=view.viewState.lineBlockAt(startPos);if(goal==null)goal=Math.min(rect.right-rect.left,view.defaultCharacterWidth*(startPos-line.from));startY=(dir<0?line.top:line.bottom)+docTop;}let resolvedGoal=rect.left+goal;let dist=distance!==null&&distance!==void 0?distance:view.viewState.heightOracle.textHeight>>1;for(let extra=0;;extra+=10){let curY=startY+(dist+extra)*dir;let pos=posAtCoords(view,{x:resolvedGoal,y:curY},false,dir);if(curY<rect.top||curY>rect.bottom||(dir<0?pos<startPos:pos>startPos)){let charRect=view.docView.coordsForChar(pos);let assoc=!charRect||curY<charRect.top?-1:1;return EditorSelection.cursor(pos,assoc,undefined,goal);}}}function skipAtomicRanges(atoms,pos,bias){for(;;){let moved=0;for(let set of atoms){set.between(pos-1,pos+1,(from,to,value)=>{if(pos>from&&pos<to){let side=moved||bias||(pos-from<to-pos?-1:1);pos=side<0?from:to;moved=side;}});}if(!moved)return pos;}}function skipAtoms(view,oldPos,pos){let newPos=skipAtomicRanges(view.state.facet(atomicRanges).map(f=>f(view)),pos.from,oldPos.head>pos.from?-1:1);return newPos==pos.from?pos:EditorSelection.cursor(newPos,newPos<pos.from?1:-1);}// This will also be where dragging info and such goes
class InputState{setSelectionOrigin(origin){this.lastSelectionOrigin=origin;this.lastSelectionTime=Date.now();}constructor(view){this.view=view;this.lastKeyCode=0;this.lastKeyTime=0;this.lastTouchTime=0;this.lastFocusTime=0;this.lastScrollTop=0;this.lastScrollLeft=0;// On iOS, some keys need to have their default behavior happen
// (after which we retroactively handle them and reset the DOM) to
// avoid messing up the virtual keyboard state.
this.pendingIOSKey=undefined;this.lastSelectionOrigin=null;this.lastSelectionTime=0;this.lastEscPress=0;this.lastContextMenu=0;this.scrollHandlers=[];this.handlers=Object.create(null);// -1 means not in a composition. Otherwise, this counts the number
// of changes made during the composition. The count is used to
// avoid treating the start state of the composition, before any
// changes have been made, as part of the composition.
this.composing=-1;// Tracks whether the next change should be marked as starting the
// composition (null means no composition, true means next is the
// first, false means first has already been marked for this
// composition)
this.compositionFirstChange=null;// End time of the previous composition
this.compositionEndedAt=0;// Used in a kludge to detect when an Enter keypress should be
// considered part of the composition on Safari, which fires events
// in the wrong order
this.compositionPendingKey=false;// Used to categorize changes as part of a composition, even when
// the mutation events fire shortly after the compositionend event
this.compositionPendingChange=false;this.mouseSelection=null;// When a drag from the editor is active, this points at the range
// being dragged.
this.draggedContent=null;this.handleEvent=this.handleEvent.bind(this);this.notifiedFocused=view.hasFocus;// On Safari adding an input event handler somehow prevents an
// issue where the composition vanishes when you press enter.
if(browser.safari)view.contentDOM.addEventListener("input",()=>null);if(browser.gecko)firefoxCopyCutHack(view.contentDOM.ownerDocument);}handleEvent(event){if(!eventBelongsToEditor(this.view,event)||this.ignoreDuringComposition(event))return;if(event.type=="keydown"&&this.keydown(event))return;this.runHandlers(event.type,event);}runHandlers(type,event){let handlers=this.handlers[type];if(handlers){for(let observer of handlers.observers)observer(this.view,event);for(let handler of handlers.handlers){if(event.defaultPrevented)break;if(handler(this.view,event)){event.preventDefault();break;}}}}ensureHandlers(plugins){let handlers=computeHandlers(plugins),prev=this.handlers,dom=this.view.contentDOM;for(let type in handlers)if(type!="scroll"){let passive=!handlers[type].handlers.length;let exists=prev[type];if(exists&&passive!=!exists.handlers.length){dom.removeEventListener(type,this.handleEvent);exists=null;}if(!exists)dom.addEventListener(type,this.handleEvent,{passive});}for(let type in prev)if(type!="scroll"&&!handlers[type])dom.removeEventListener(type,this.handleEvent);this.handlers=handlers;}keydown(event){// Must always run, even if a custom handler handled the event
this.lastKeyCode=event.keyCode;this.lastKeyTime=Date.now();if(event.keyCode==9&&Date.now()<this.lastEscPress+2000)return true;if(event.keyCode!=27&&modifierCodes.indexOf(event.keyCode)<0)this.view.inputState.lastEscPress=0;// Chrome for Android usually doesn't fire proper key events, but
// occasionally does, usually surrounded by a bunch of complicated
// composition changes. When an enter or backspace key event is
// seen, hold off on handling DOM events for a bit, and then
// dispatch it.
if(browser.android&&browser.chrome&&!event.synthetic&&(event.keyCode==13||event.keyCode==8)){this.view.observer.delayAndroidKey(event.key,event.keyCode);return true;}// Preventing the default behavior of Enter on iOS makes the
// virtual keyboard get stuck in the wrong (lowercase)
// state. So we let it go through, and then, in
// applyDOMChange, notify key handlers of it and reset to
// the state they produce.
let pending;if(browser.ios&&!event.synthetic&&!event.altKey&&!event.metaKey&&((pending=PendingKeys.find(key=>key.keyCode==event.keyCode))&&!event.ctrlKey||EmacsyPendingKeys.indexOf(event.key)>-1&&event.ctrlKey&&!event.shiftKey)){this.pendingIOSKey=pending||event;setTimeout(()=>this.flushIOSKey(),250);return true;}if(event.keyCode!=229)this.view.observer.forceFlush();return false;}flushIOSKey(){let key=this.pendingIOSKey;if(!key)return false;this.pendingIOSKey=undefined;return dispatchKey(this.view.contentDOM,key.key,key.keyCode);}ignoreDuringComposition(event){if(!/^key/.test(event.type))return false;if(this.composing>0)return true;// See https://www.stum.de/2016/06/24/handling-ime-events-in-javascript/.
// On some input method editors (IMEs), the Enter key is used to
// confirm character selection. On Safari, when Enter is pressed,
// compositionend and keydown events are sometimes emitted in the
// wrong order. The key event should still be ignored, even when
// it happens after the compositionend event.
if(browser.safari&&!browser.ios&&this.compositionPendingKey&&Date.now()-this.compositionEndedAt<100){this.compositionPendingKey=false;return true;}return false;}startMouseSelection(mouseSelection){if(this.mouseSelection)this.mouseSelection.destroy();this.mouseSelection=mouseSelection;}update(update){if(this.mouseSelection)this.mouseSelection.update(update);if(this.draggedContent&&update.docChanged)this.draggedContent=this.draggedContent.map(update.changes);if(update.transactions.length)this.lastKeyCode=this.lastSelectionTime=0;}destroy(){if(this.mouseSelection)this.mouseSelection.destroy();}}function bindHandler(plugin,handler){return(view,event)=>{try{return handler.call(plugin,event,view);}catch(e){logException(view.state,e);}};}function computeHandlers(plugins){let result=Object.create(null);function record(type){return result[type]||(result[type]={observers:[],handlers:[]});}for(let plugin of plugins){let spec=plugin.spec;if(spec&&spec.domEventHandlers)for(let type in spec.domEventHandlers){let f=spec.domEventHandlers[type];if(f)record(type).handlers.push(bindHandler(plugin.value,f));}if(spec&&spec.domEventObservers)for(let type in spec.domEventObservers){let f=spec.domEventObservers[type];if(f)record(type).observers.push(bindHandler(plugin.value,f));}}for(let type in handlers)record(type).handlers.push(handlers[type]);for(let type in observers)record(type).observers.push(observers[type]);return result;}const PendingKeys=[{key:"Backspace",keyCode:8,inputType:"deleteContentBackward"},{key:"Enter",keyCode:13,inputType:"insertParagraph"},{key:"Enter",keyCode:13,inputType:"insertLineBreak"},{key:"Delete",keyCode:46,inputType:"deleteContentForward"}];const EmacsyPendingKeys="dthko";// Key codes for modifier keys
const modifierCodes=[16,17,18,20,91,92,224,225];const dragScrollMargin=6;function dragScrollSpeed(dist){return Math.max(0,dist)*0.7+8;}function dist(a,b){return Math.max(Math.abs(a.clientX-b.clientX),Math.abs(a.clientY-b.clientY));}class MouseSelection{constructor(view,startEvent,style,mustSelect){this.view=view;this.startEvent=startEvent;this.style=style;this.mustSelect=mustSelect;this.scrollSpeed={x:0,y:0};this.scrolling=-1;this.lastEvent=startEvent;this.scrollParent=scrollableParent(view.contentDOM);this.atoms=view.state.facet(atomicRanges).map(f=>f(view));let doc=view.contentDOM.ownerDocument;doc.addEventListener("mousemove",this.move=this.move.bind(this));doc.addEventListener("mouseup",this.up=this.up.bind(this));this.extend=startEvent.shiftKey;this.multiple=view.state.facet(EditorState.allowMultipleSelections)&&addsSelectionRange(view,startEvent);this.dragging=isInPrimarySelection(view,startEvent)&&getClickType(startEvent)==1?null:false;}start(event){// When clicking outside of the selection, immediately apply the
// effect of starting the selection
if(this.dragging===false)this.select(event);}move(event){var _a;if(event.buttons==0)return this.destroy();if(this.dragging||this.dragging==null&&dist(this.startEvent,event)<10)return;this.select(this.lastEvent=event);let sx=0,sy=0;let rect=((_a=this.scrollParent)===null||_a===void 0?void 0:_a.getBoundingClientRect())||{left:0,top:0,right:this.view.win.innerWidth,bottom:this.view.win.innerHeight};let margins=getScrollMargins(this.view);if(event.clientX-margins.left<=rect.left+dragScrollMargin)sx=-dragScrollSpeed(rect.left-event.clientX);else if(event.clientX+margins.right>=rect.right-dragScrollMargin)sx=dragScrollSpeed(event.clientX-rect.right);if(event.clientY-margins.top<=rect.top+dragScrollMargin)sy=-dragScrollSpeed(rect.top-event.clientY);else if(event.clientY+margins.bottom>=rect.bottom-dragScrollMargin)sy=dragScrollSpeed(event.clientY-rect.bottom);this.setScrollSpeed(sx,sy);}up(event){if(this.dragging==null)this.select(this.lastEvent);if(!this.dragging)event.preventDefault();this.destroy();}destroy(){this.setScrollSpeed(0,0);let doc=this.view.contentDOM.ownerDocument;doc.removeEventListener("mousemove",this.move);doc.removeEventListener("mouseup",this.up);this.view.inputState.mouseSelection=this.view.inputState.draggedContent=null;}setScrollSpeed(sx,sy){this.scrollSpeed={x:sx,y:sy};if(sx||sy){if(this.scrolling<0)this.scrolling=setInterval(()=>this.scroll(),50);}else if(this.scrolling>-1){clearInterval(this.scrolling);this.scrolling=-1;}}scroll(){if(this.scrollParent){this.scrollParent.scrollLeft+=this.scrollSpeed.x;this.scrollParent.scrollTop+=this.scrollSpeed.y;}else{this.view.win.scrollBy(this.scrollSpeed.x,this.scrollSpeed.y);}if(this.dragging===false)this.select(this.lastEvent);}skipAtoms(sel){let ranges=null;for(let i=0;i<sel.ranges.length;i++){let range=sel.ranges[i],updated=null;if(range.empty){let pos=skipAtomicRanges(this.atoms,range.from,0);if(pos!=range.from)updated=EditorSelection.cursor(pos,-1);}else{let from=skipAtomicRanges(this.atoms,range.from,-1);let to=skipAtomicRanges(this.atoms,range.to,1);if(from!=range.from||to!=range.to)updated=EditorSelection.range(range.from==range.anchor?from:to,range.from==range.head?from:to);}if(updated){if(!ranges)ranges=sel.ranges.slice();ranges[i]=updated;}}return ranges?EditorSelection.create(ranges,sel.mainIndex):sel;}select(event){let{view}=this,selection=this.skipAtoms(this.style.get(event,this.extend,this.multiple));if(this.mustSelect||!selection.eq(view.state.selection,this.dragging===false))this.view.dispatch({selection,userEvent:"select.pointer"});this.mustSelect=false;}update(update){if(this.style.update(update))setTimeout(()=>this.select(this.lastEvent),20);}}function addsSelectionRange(view,event){let facet=view.state.facet(clickAddsSelectionRange);return facet.length?facet[0](event):browser.mac?event.metaKey:event.ctrlKey;}function dragMovesSelection(view,event){let facet=view.state.facet(dragMovesSelection$1);return facet.length?facet[0](event):browser.mac?!event.altKey:!event.ctrlKey;}function isInPrimarySelection(view,event){let{main}=view.state.selection;if(main.empty)return false;// On boundary clicks, check whether the coordinates are inside the
// selection's client rectangles
let sel=getSelection(view.root);if(!sel||sel.rangeCount==0)return true;let rects=sel.getRangeAt(0).getClientRects();for(let i=0;i<rects.length;i++){let rect=rects[i];if(rect.left<=event.clientX&&rect.right>=event.clientX&&rect.top<=event.clientY&&rect.bottom>=event.clientY)return true;}return false;}function eventBelongsToEditor(view,event){if(!event.bubbles)return true;if(event.defaultPrevented)return false;for(let node=event.target,cView;node!=view.contentDOM;node=node.parentNode)if(!node||node.nodeType==11||(cView=ContentView.get(node))&&cView.ignoreEvent(event))return false;return true;}const handlers=/*@__PURE__*/Object.create(null);const observers=/*@__PURE__*/Object.create(null);// This is very crude, but unfortunately both these browsers _pretend_
// that they have a clipboard API—all the objects and methods are
// there, they just don't work, and they are hard to test.
const brokenClipboardAPI=browser.ie&&browser.ie_version<15||browser.ios&&browser.webkit_version<604;function capturePaste(view){let parent=view.dom.parentNode;if(!parent)return;let target=parent.appendChild(document.createElement("textarea"));target.style.cssText="position: fixed; left: -10000px; top: 10px";target.focus();setTimeout(()=>{view.focus();target.remove();doPaste(view,target.value);},50);}function doPaste(view,input){let{state}=view,changes,i=1,text=state.toText(input);let byLine=text.lines==state.selection.ranges.length;let linewise=lastLinewiseCopy!=null&&state.selection.ranges.every(r=>r.empty)&&lastLinewiseCopy==text.toString();if(linewise){let lastLine=-1;changes=state.changeByRange(range=>{let line=state.doc.lineAt(range.from);if(line.from==lastLine)return{range};lastLine=line.from;let insert=state.toText((byLine?text.line(i++).text:input)+state.lineBreak);return{changes:{from:line.from,insert},range:EditorSelection.cursor(range.from+insert.length)};});}else if(byLine){changes=state.changeByRange(range=>{let line=text.line(i++);return{changes:{from:range.from,to:range.to,insert:line.text},range:EditorSelection.cursor(range.from+line.length)};});}else{changes=state.replaceSelection(text);}view.dispatch(changes,{userEvent:"input.paste",scrollIntoView:true});}observers.scroll=view=>{view.inputState.lastScrollTop=view.scrollDOM.scrollTop;view.inputState.lastScrollLeft=view.scrollDOM.scrollLeft;};handlers.keydown=(view,event)=>{view.inputState.setSelectionOrigin("select");if(event.keyCode==27)view.inputState.lastEscPress=Date.now();return false;};observers.touchstart=(view,e)=>{view.inputState.lastTouchTime=Date.now();view.inputState.setSelectionOrigin("select.pointer");};observers.touchmove=view=>{view.inputState.setSelectionOrigin("select.pointer");};handlers.mousedown=(view,event)=>{view.observer.flush();if(view.inputState.lastTouchTime>Date.now()-2000)return false;// Ignore touch interaction
let style=null;for(let makeStyle of view.state.facet(mouseSelectionStyle)){style=makeStyle(view,event);if(style)break;}if(!style&&event.button==0)style=basicMouseSelection(view,event);if(style){let mustFocus=!view.hasFocus;view.inputState.startMouseSelection(new MouseSelection(view,event,style,mustFocus));if(mustFocus)view.observer.ignore(()=>focusPreventScroll(view.contentDOM));let mouseSel=view.inputState.mouseSelection;if(mouseSel){mouseSel.start(event);return mouseSel.dragging===false;}}return false;};function rangeForClick(view,pos,bias,type){if(type==1){// Single click
return EditorSelection.cursor(pos,bias);}else if(type==2){// Double click
return groupAt(view.state,pos,bias);}else{// Triple click
let visual=LineView.find(view.docView,pos),line=view.state.doc.lineAt(visual?visual.posAtEnd:pos);let from=visual?visual.posAtStart:line.from,to=visual?visual.posAtEnd:line.to;if(to<view.state.doc.length&&to==line.to)to++;return EditorSelection.range(from,to);}}let insideY=(y,rect)=>y>=rect.top&&y<=rect.bottom;let inside=(x,y,rect)=>insideY(y,rect)&&x>=rect.left&&x<=rect.right;// Try to determine, for the given coordinates, associated with the
// given position, whether they are related to the element before or
// the element after the position.
function findPositionSide(view,pos,x,y){let line=LineView.find(view.docView,pos);if(!line)return 1;let off=pos-line.posAtStart;// Line boundaries point into the line
if(off==0)return 1;if(off==line.length)return-1;// Positions on top of an element point at that element
let before=line.coordsAt(off,-1);if(before&&inside(x,y,before))return-1;let after=line.coordsAt(off,1);if(after&&inside(x,y,after))return 1;// This is probably a line wrap point. Pick before if the point is
// beside it.
return before&&insideY(y,before)?-1:1;}function queryPos(view,event){let pos=view.posAtCoords({x:event.clientX,y:event.clientY},false);return{pos,bias:findPositionSide(view,pos,event.clientX,event.clientY)};}const BadMouseDetail=browser.ie&&browser.ie_version<=11;let lastMouseDown=null,lastMouseDownCount=0,lastMouseDownTime=0;function getClickType(event){if(!BadMouseDetail)return event.detail;let last=lastMouseDown,lastTime=lastMouseDownTime;lastMouseDown=event;lastMouseDownTime=Date.now();return lastMouseDownCount=!last||lastTime>Date.now()-400&&Math.abs(last.clientX-event.clientX)<2&&Math.abs(last.clientY-event.clientY)<2?(lastMouseDownCount+1)%3:1;}function basicMouseSelection(view,event){let start=queryPos(view,event),type=getClickType(event);let startSel=view.state.selection;return{update(update){if(update.docChanged){start.pos=update.changes.mapPos(start.pos);startSel=startSel.map(update.changes);}},get(event,extend,multiple){let cur=queryPos(view,event),removed;let range=rangeForClick(view,cur.pos,cur.bias,type);if(start.pos!=cur.pos&&!extend){let startRange=rangeForClick(view,start.pos,start.bias,type);let from=Math.min(startRange.from,range.from),to=Math.max(startRange.to,range.to);range=from<range.from?EditorSelection.range(from,to):EditorSelection.range(to,from);}if(extend)return startSel.replaceRange(startSel.main.extend(range.from,range.to));else if(multiple&&type==1&&startSel.ranges.length>1&&(removed=removeRangeAround(startSel,cur.pos)))return removed;else if(multiple)return startSel.addRange(range);else return EditorSelection.create([range]);}};}function removeRangeAround(sel,pos){for(let i=0;i<sel.ranges.length;i++){let{from,to}=sel.ranges[i];if(from<=pos&&to>=pos)return EditorSelection.create(sel.ranges.slice(0,i).concat(sel.ranges.slice(i+1)),sel.mainIndex==i?0:sel.mainIndex-(sel.mainIndex>i?1:0));}return null;}handlers.dragstart=(view,event)=>{let{selection:{main:range}}=view.state;if(event.target.draggable){let cView=view.docView.nearest(event.target);if(cView&&cView.isWidget){let from=cView.posAtStart,to=from+cView.length;if(from>=range.to||to<=range.from)range=EditorSelection.range(from,to);}}let{inputState}=view;if(inputState.mouseSelection)inputState.mouseSelection.dragging=true;inputState.draggedContent=range;if(event.dataTransfer){event.dataTransfer.setData("Text",view.state.sliceDoc(range.from,range.to));event.dataTransfer.effectAllowed="copyMove";}return false;};handlers.dragend=view=>{view.inputState.draggedContent=null;return false;};function dropText(view,event,text,direct){if(!text)return;let dropPos=view.posAtCoords({x:event.clientX,y:event.clientY},false);let{draggedContent}=view.inputState;let del=direct&&draggedContent&&dragMovesSelection(view,event)?{from:draggedContent.from,to:draggedContent.to}:null;let ins={from:dropPos,insert:text};let changes=view.state.changes(del?[del,ins]:ins);view.focus();view.dispatch({changes,selection:{anchor:changes.mapPos(dropPos,-1),head:changes.mapPos(dropPos,1)},userEvent:del?"move.drop":"input.drop"});view.inputState.draggedContent=null;}handlers.drop=(view,event)=>{if(!event.dataTransfer)return false;if(view.state.readOnly)return true;let files=event.dataTransfer.files;if(files&&files.length){// For a file drop, read the file's text.
let text=Array(files.length),read=0;let finishFile=()=>{if(++read==files.length)dropText(view,event,text.filter(s=>s!=null).join(view.state.lineBreak),false);};for(let i=0;i<files.length;i++){let reader=new FileReader();reader.onerror=finishFile;reader.onload=()=>{if(!/[\x00-\x08\x0e-\x1f]{2}/.test(reader.result))text[i]=reader.result;finishFile();};reader.readAsText(files[i]);}return true;}else{let text=event.dataTransfer.getData("Text");if(text){dropText(view,event,text,true);return true;}}return false;};handlers.paste=(view,event)=>{if(view.state.readOnly)return true;view.observer.flush();let data=brokenClipboardAPI?null:event.clipboardData;if(data){doPaste(view,data.getData("text/plain")||data.getData("text/uri-text"));return true;}else{capturePaste(view);return false;}};function captureCopy(view,text){// The extra wrapper is somehow necessary on IE/Edge to prevent the
// content from being mangled when it is put onto the clipboard
let parent=view.dom.parentNode;if(!parent)return;let target=parent.appendChild(document.createElement("textarea"));target.style.cssText="position: fixed; left: -10000px; top: 10px";target.value=text;target.focus();target.selectionEnd=text.length;target.selectionStart=0;setTimeout(()=>{target.remove();view.focus();},50);}function copiedRange(state){let content=[],ranges=[],linewise=false;for(let range of state.selection.ranges)if(!range.empty){content.push(state.sliceDoc(range.from,range.to));ranges.push(range);}if(!content.length){// Nothing selected, do a line-wise copy
let upto=-1;for(let{from}of state.selection.ranges){let line=state.doc.lineAt(from);if(line.number>upto){content.push(line.text);ranges.push({from:line.from,to:Math.min(state.doc.length,line.to+1)});}upto=line.number;}linewise=true;}return{text:content.join(state.lineBreak),ranges,linewise};}let lastLinewiseCopy=null;handlers.copy=handlers.cut=(view,event)=>{let{text,ranges,linewise}=copiedRange(view.state);if(!text&&!linewise)return false;lastLinewiseCopy=linewise?text:null;if(event.type=="cut"&&!view.state.readOnly)view.dispatch({changes:ranges,scrollIntoView:true,userEvent:"delete.cut"});let data=brokenClipboardAPI?null:event.clipboardData;if(data){data.clearData();data.setData("text/plain",text);return true;}else{captureCopy(view,text);return false;}};const isFocusChange=/*@__PURE__*/Annotation.define();function focusChangeTransaction(state,focus){let effects=[];for(let getEffect of state.facet(focusChangeEffect)){let effect=getEffect(state,focus);if(effect)effects.push(effect);}return effects?state.update({effects,annotations:isFocusChange.of(true)}):null;}function updateForFocusChange(view){setTimeout(()=>{let focus=view.hasFocus;if(focus!=view.inputState.notifiedFocused){let tr=focusChangeTransaction(view.state,focus);if(tr)view.dispatch(tr);else view.update([]);}},10);}observers.focus=view=>{view.inputState.lastFocusTime=Date.now();// When focusing reset the scroll position, move it back to where it was
if(!view.scrollDOM.scrollTop&&(view.inputState.lastScrollTop||view.inputState.lastScrollLeft)){view.scrollDOM.scrollTop=view.inputState.lastScrollTop;view.scrollDOM.scrollLeft=view.inputState.lastScrollLeft;}updateForFocusChange(view);};observers.blur=view=>{view.observer.clearSelectionRange();updateForFocusChange(view);};observers.compositionstart=observers.compositionupdate=view=>{if(view.inputState.compositionFirstChange==null)view.inputState.compositionFirstChange=true;if(view.inputState.composing<0){// FIXME possibly set a timeout to clear it again on Android
view.inputState.composing=0;if(view.docView.maybeCreateCompositionBarrier()){view.update([]);view.docView.clearCompositionBarrier();}}};observers.compositionend=view=>{view.inputState.composing=-1;view.inputState.compositionEndedAt=Date.now();view.inputState.compositionPendingKey=true;view.inputState.compositionPendingChange=view.observer.pendingRecords().length>0;view.inputState.compositionFirstChange=null;if(browser.chrome&&browser.android){// Delay flushing for a bit on Android because it'll often fire a
// bunch of contradictory changes in a row at end of compositon
view.observer.flushSoon();}else if(view.inputState.compositionPendingChange){// If we found pending records, schedule a flush.
Promise.resolve().then(()=>view.observer.flush());}else{// Otherwise, make sure that, if no changes come in soon, the
// composition view is cleared.
setTimeout(()=>{if(view.inputState.composing<0&&view.docView.hasComposition)view.update([]);},50);}};observers.contextmenu=view=>{view.inputState.lastContextMenu=Date.now();};handlers.beforeinput=(view,event)=>{var _a;// Because Chrome Android doesn't fire useful key events, use
// beforeinput to detect backspace (and possibly enter and delete,
// but those usually don't even seem to fire beforeinput events at
// the moment) and fake a key event for it.
//
// (preventDefault on beforeinput, though supported in the spec,
// seems to do nothing at all on Chrome).
let pending;if(browser.chrome&&browser.android&&(pending=PendingKeys.find(key=>key.inputType==event.inputType))){view.observer.delayAndroidKey(pending.key,pending.keyCode);if(pending.key=="Backspace"||pending.key=="Delete"){let startViewHeight=((_a=window.visualViewport)===null||_a===void 0?void 0:_a.height)||0;setTimeout(()=>{var _a;// Backspacing near uneditable nodes on Chrome Android sometimes
// closes the virtual keyboard. This tries to crudely detect
// that and refocus to get it back.
if((((_a=window.visualViewport)===null||_a===void 0?void 0:_a.height)||0)>startViewHeight+10&&view.hasFocus){view.contentDOM.blur();view.focus();}},100);}}return false;};const appliedFirefoxHack=/*@__PURE__*/new Set();// In Firefox, when cut/copy handlers are added to the document, that
// somehow avoids a bug where those events aren't fired when the
// selection is empty. See https://github.com/codemirror/dev/issues/1082
// and https://bugzilla.mozilla.org/show_bug.cgi?id=995961
function firefoxCopyCutHack(doc){if(!appliedFirefoxHack.has(doc)){appliedFirefoxHack.add(doc);doc.addEventListener("copy",()=>{});doc.addEventListener("cut",()=>{});}}const wrappingWhiteSpace=["pre-wrap","normal","pre-line","break-spaces"];class HeightOracle{constructor(lineWrapping){this.lineWrapping=lineWrapping;this.doc=Text.empty;this.heightSamples={};this.lineHeight=14;// The height of an entire line (line-height)
this.charWidth=7;this.textHeight=14;// The height of the actual font (font-size)
this.lineLength=30;// Used to track, during updateHeight, if any actual heights changed
this.heightChanged=false;}heightForGap(from,to){let lines=this.doc.lineAt(to).number-this.doc.lineAt(from).number+1;if(this.lineWrapping)lines+=Math.max(0,Math.ceil((to-from-lines*this.lineLength*0.5)/this.lineLength));return this.lineHeight*lines;}heightForLine(length){if(!this.lineWrapping)return this.lineHeight;let lines=1+Math.max(0,Math.ceil((length-this.lineLength)/(this.lineLength-5)));return lines*this.lineHeight;}setDoc(doc){this.doc=doc;return this;}mustRefreshForWrapping(whiteSpace){return wrappingWhiteSpace.indexOf(whiteSpace)>-1!=this.lineWrapping;}mustRefreshForHeights(lineHeights){let newHeight=false;for(let i=0;i<lineHeights.length;i++){let h=lineHeights[i];if(h<0){i++;}else if(!this.heightSamples[Math.floor(h*10)]){// Round to .1 pixels
newHeight=true;this.heightSamples[Math.floor(h*10)]=true;}}return newHeight;}refresh(whiteSpace,lineHeight,charWidth,textHeight,lineLength,knownHeights){let lineWrapping=wrappingWhiteSpace.indexOf(whiteSpace)>-1;let changed=Math.round(lineHeight)!=Math.round(this.lineHeight)||this.lineWrapping!=lineWrapping;this.lineWrapping=lineWrapping;this.lineHeight=lineHeight;this.charWidth=charWidth;this.textHeight=textHeight;this.lineLength=lineLength;if(changed){this.heightSamples={};for(let i=0;i<knownHeights.length;i++){let h=knownHeights[i];if(h<0)i++;else this.heightSamples[Math.floor(h*10)]=true;}}return changed;}}// This object is used by `updateHeight` to make DOM measurements
// arrive at the right nides. The `heights` array is a sequence of
// block heights, starting from position `from`.
class MeasuredHeights{constructor(from,heights){this.from=from;this.heights=heights;this.index=0;}get more(){return this.index<this.heights.length;}}/**
  Record used to represent information about a block-level element
  in the editor view.
  */class BlockInfo{/**
      @internal
      */constructor(/**
      The start of the element in the document.
      */from,/**
      The length of the element.
      */length,/**
      The top position of the element (relative to the top of the
      document).
      */top,/**
      Its height.
      */height,/**
      @internal Weird packed field that holds an array of children
      for composite blocks, a decoration for block widgets, and a
      number indicating the amount of widget-create line breaks for
      text blocks.
      */_content){this.from=from;this.length=length;this.top=top;this.height=height;this._content=_content;}/**
      The type of element this is. When querying lines, this may be
      an array of all the blocks that make up the line.
      */get type(){return typeof this._content=="number"?BlockType.Text:Array.isArray(this._content)?this._content:this._content.type;}/**
      The end of the element as a document position.
      */get to(){return this.from+this.length;}/**
      The bottom position of the element.
      */get bottom(){return this.top+this.height;}/**
      If this is a widget block, this will return the widget
      associated with it.
      */get widget(){return this._content instanceof PointDecoration?this._content.widget:null;}/**
      If this is a textblock, this holds the number of line breaks
      that appear in widgets inside the block.
      */get widgetLineBreaks(){return typeof this._content=="number"?this._content:0;}/**
      @internal
      */join(other){let content=(Array.isArray(this._content)?this._content:[this]).concat(Array.isArray(other._content)?other._content:[other]);return new BlockInfo(this.from,this.length+other.length,this.top,this.height+other.height,content);}}var QueryType$1=/*@__PURE__*/function(QueryType){QueryType[QueryType["ByPos"]=0]="ByPos";QueryType[QueryType["ByHeight"]=1]="ByHeight";QueryType[QueryType["ByPosNoHeight"]=2]="ByPosNoHeight";return QueryType;}(QueryType$1||(QueryType$1={}));const Epsilon=1e-3;class HeightMap{constructor(length,// The number of characters covered
height,// Height of this part of the document
flags=2/* Flag.Outdated */){this.length=length;this.height=height;this.flags=flags;}get outdated(){return(this.flags&2/* Flag.Outdated */)>0;}set outdated(value){this.flags=(value?2/* Flag.Outdated */:0)|this.flags&-3/* Flag.Outdated */;}setHeight(oracle,height){if(this.height!=height){if(Math.abs(this.height-height)>Epsilon)oracle.heightChanged=true;this.height=height;}}// Base case is to replace a leaf node, which simply builds a tree
// from the new nodes and returns that (HeightMapBranch and
// HeightMapGap override this to actually use from/to)
replace(_from,_to,nodes){return HeightMap.of(nodes);}// Again, these are base cases, and are overridden for branch and gap nodes.
decomposeLeft(_to,result){result.push(this);}decomposeRight(_from,result){result.push(this);}applyChanges(decorations,oldDoc,oracle,changes){let me=this,doc=oracle.doc;for(let i=changes.length-1;i>=0;i--){let{fromA,toA,fromB,toB}=changes[i];let start=me.lineAt(fromA,QueryType$1.ByPosNoHeight,oracle.setDoc(oldDoc),0,0);let end=start.to>=toA?start:me.lineAt(toA,QueryType$1.ByPosNoHeight,oracle,0,0);toB+=end.to-toA;toA=end.to;while(i>0&&start.from<=changes[i-1].toA){fromA=changes[i-1].fromA;fromB=changes[i-1].fromB;i--;if(fromA<start.from)start=me.lineAt(fromA,QueryType$1.ByPosNoHeight,oracle,0,0);}fromB+=start.from-fromA;fromA=start.from;let nodes=NodeBuilder.build(oracle.setDoc(doc),decorations,fromB,toB);me=me.replace(fromA,toA,nodes);}return me.updateHeight(oracle,0);}static empty(){return new HeightMapText(0,0);}// nodes uses null values to indicate the position of line breaks.
// There are never line breaks at the start or end of the array, or
// two line breaks next to each other, and the array isn't allowed
// to be empty (same restrictions as return value from the builder).
static of(nodes){if(nodes.length==1)return nodes[0];let i=0,j=nodes.length,before=0,after=0;for(;;){if(i==j){if(before>after*2){let split=nodes[i-1];if(split.break)nodes.splice(--i,1,split.left,null,split.right);else nodes.splice(--i,1,split.left,split.right);j+=1+split.break;before-=split.size;}else if(after>before*2){let split=nodes[j];if(split.break)nodes.splice(j,1,split.left,null,split.right);else nodes.splice(j,1,split.left,split.right);j+=2+split.break;after-=split.size;}else{break;}}else if(before<after){let next=nodes[i++];if(next)before+=next.size;}else{let next=nodes[--j];if(next)after+=next.size;}}let brk=0;if(nodes[i-1]==null){brk=1;i--;}else if(nodes[i]==null){brk=1;j++;}return new HeightMapBranch(HeightMap.of(nodes.slice(0,i)),brk,HeightMap.of(nodes.slice(j)));}}HeightMap.prototype.size=1;class HeightMapBlock extends HeightMap{constructor(length,height,deco){super(length,height);this.deco=deco;}blockAt(_height,_oracle,top,offset){return new BlockInfo(offset,this.length,top,this.height,this.deco||0);}lineAt(_value,_type,oracle,top,offset){return this.blockAt(0,oracle,top,offset);}forEachLine(from,to,oracle,top,offset,f){if(from<=offset+this.length&&to>=offset)f(this.blockAt(0,oracle,top,offset));}updateHeight(oracle,offset=0,_force=false,measured){if(measured&&measured.from<=offset&&measured.more)this.setHeight(oracle,measured.heights[measured.index++]);this.outdated=false;return this;}toString(){return`block(${this.length})`;}}class HeightMapText extends HeightMapBlock{constructor(length,height){super(length,height,null);this.collapsed=0;// Amount of collapsed content in the line
this.widgetHeight=0;// Maximum inline widget height
this.breaks=0;// Number of widget-introduced line breaks on the line
}blockAt(_height,_oracle,top,offset){return new BlockInfo(offset,this.length,top,this.height,this.breaks);}replace(_from,_to,nodes){let node=nodes[0];if(nodes.length==1&&(node instanceof HeightMapText||node instanceof HeightMapGap&&node.flags&4/* Flag.SingleLine */)&&Math.abs(this.length-node.length)<10){if(node instanceof HeightMapGap)node=new HeightMapText(node.length,this.height);else node.height=this.height;if(!this.outdated)node.outdated=false;return node;}else{return HeightMap.of(nodes);}}updateHeight(oracle,offset=0,force=false,measured){if(measured&&measured.from<=offset&&measured.more)this.setHeight(oracle,measured.heights[measured.index++]);else if(force||this.outdated)this.setHeight(oracle,Math.max(this.widgetHeight,oracle.heightForLine(this.length-this.collapsed))+this.breaks*oracle.lineHeight);this.outdated=false;return this;}toString(){return`line(${this.length}${this.collapsed?-this.collapsed:""}${this.widgetHeight?":"+this.widgetHeight:""})`;}}class HeightMapGap extends HeightMap{constructor(length){super(length,0);}heightMetrics(oracle,offset){let firstLine=oracle.doc.lineAt(offset).number,lastLine=oracle.doc.lineAt(offset+this.length).number;let lines=lastLine-firstLine+1;let perLine,perChar=0;if(oracle.lineWrapping){let totalPerLine=Math.min(this.height,oracle.lineHeight*lines);perLine=totalPerLine/lines;if(this.length>lines+1)perChar=(this.height-totalPerLine)/(this.length-lines-1);}else{perLine=this.height/lines;}return{firstLine,lastLine,perLine,perChar};}blockAt(height,oracle,top,offset){let{firstLine,lastLine,perLine,perChar}=this.heightMetrics(oracle,offset);if(oracle.lineWrapping){let guess=offset+Math.round(Math.max(0,Math.min(1,(height-top)/this.height))*this.length);let line=oracle.doc.lineAt(guess),lineHeight=perLine+line.length*perChar;let lineTop=Math.max(top,height-lineHeight/2);return new BlockInfo(line.from,line.length,lineTop,lineHeight,0);}else{let line=Math.max(0,Math.min(lastLine-firstLine,Math.floor((height-top)/perLine)));let{from,length}=oracle.doc.line(firstLine+line);return new BlockInfo(from,length,top+perLine*line,perLine,0);}}lineAt(value,type,oracle,top,offset){if(type==QueryType$1.ByHeight)return this.blockAt(value,oracle,top,offset);if(type==QueryType$1.ByPosNoHeight){let{from,to}=oracle.doc.lineAt(value);return new BlockInfo(from,to-from,0,0,0);}let{firstLine,perLine,perChar}=this.heightMetrics(oracle,offset);let line=oracle.doc.lineAt(value),lineHeight=perLine+line.length*perChar;let linesAbove=line.number-firstLine;let lineTop=top+perLine*linesAbove+perChar*(line.from-offset-linesAbove);return new BlockInfo(line.from,line.length,Math.max(top,Math.min(lineTop,top+this.height-lineHeight)),lineHeight,0);}forEachLine(from,to,oracle,top,offset,f){from=Math.max(from,offset);to=Math.min(to,offset+this.length);let{firstLine,perLine,perChar}=this.heightMetrics(oracle,offset);for(let pos=from,lineTop=top;pos<=to;){let line=oracle.doc.lineAt(pos);if(pos==from){let linesAbove=line.number-firstLine;lineTop+=perLine*linesAbove+perChar*(from-offset-linesAbove);}let lineHeight=perLine+perChar*line.length;f(new BlockInfo(line.from,line.length,lineTop,lineHeight,0));lineTop+=lineHeight;pos=line.to+1;}}replace(from,to,nodes){let after=this.length-to;if(after>0){let last=nodes[nodes.length-1];if(last instanceof HeightMapGap)nodes[nodes.length-1]=new HeightMapGap(last.length+after);else nodes.push(null,new HeightMapGap(after-1));}if(from>0){let first=nodes[0];if(first instanceof HeightMapGap)nodes[0]=new HeightMapGap(from+first.length);else nodes.unshift(new HeightMapGap(from-1),null);}return HeightMap.of(nodes);}decomposeLeft(to,result){result.push(new HeightMapGap(to-1),null);}decomposeRight(from,result){result.push(null,new HeightMapGap(this.length-from-1));}updateHeight(oracle,offset=0,force=false,measured){let end=offset+this.length;if(measured&&measured.from<=offset+this.length&&measured.more){// Fill in part of this gap with measured lines. We know there
// can't be widgets or collapsed ranges in those lines, because
// they would already have been added to the heightmap (gaps
// only contain plain text).
let nodes=[],pos=Math.max(offset,measured.from),singleHeight=-1;if(measured.from>offset)nodes.push(new HeightMapGap(measured.from-offset-1).updateHeight(oracle,offset));while(pos<=end&&measured.more){let len=oracle.doc.lineAt(pos).length;if(nodes.length)nodes.push(null);let height=measured.heights[measured.index++];if(singleHeight==-1)singleHeight=height;else if(Math.abs(height-singleHeight)>=Epsilon)singleHeight=-2;let line=new HeightMapText(len,height);line.outdated=false;nodes.push(line);pos+=len+1;}if(pos<=end)nodes.push(null,new HeightMapGap(end-pos).updateHeight(oracle,pos));let result=HeightMap.of(nodes);if(singleHeight<0||Math.abs(result.height-this.height)>=Epsilon||Math.abs(singleHeight-this.heightMetrics(oracle,offset).perLine)>=Epsilon)oracle.heightChanged=true;return result;}else if(force||this.outdated){this.setHeight(oracle,oracle.heightForGap(offset,offset+this.length));this.outdated=false;}return this;}toString(){return`gap(${this.length})`;}}class HeightMapBranch extends HeightMap{constructor(left,brk,right){super(left.length+brk+right.length,left.height+right.height,brk|(left.outdated||right.outdated?2/* Flag.Outdated */:0));this.left=left;this.right=right;this.size=left.size+right.size;}get break(){return this.flags&1/* Flag.Break */;}blockAt(height,oracle,top,offset){let mid=top+this.left.height;return height<mid?this.left.blockAt(height,oracle,top,offset):this.right.blockAt(height,oracle,mid,offset+this.left.length+this.break);}lineAt(value,type,oracle,top,offset){let rightTop=top+this.left.height,rightOffset=offset+this.left.length+this.break;let left=type==QueryType$1.ByHeight?value<rightTop:value<rightOffset;let base=left?this.left.lineAt(value,type,oracle,top,offset):this.right.lineAt(value,type,oracle,rightTop,rightOffset);if(this.break||(left?base.to<rightOffset:base.from>rightOffset))return base;let subQuery=type==QueryType$1.ByPosNoHeight?QueryType$1.ByPosNoHeight:QueryType$1.ByPos;if(left)return base.join(this.right.lineAt(rightOffset,subQuery,oracle,rightTop,rightOffset));else return this.left.lineAt(rightOffset,subQuery,oracle,top,offset).join(base);}forEachLine(from,to,oracle,top,offset,f){let rightTop=top+this.left.height,rightOffset=offset+this.left.length+this.break;if(this.break){if(from<rightOffset)this.left.forEachLine(from,to,oracle,top,offset,f);if(to>=rightOffset)this.right.forEachLine(from,to,oracle,rightTop,rightOffset,f);}else{let mid=this.lineAt(rightOffset,QueryType$1.ByPos,oracle,top,offset);if(from<mid.from)this.left.forEachLine(from,mid.from-1,oracle,top,offset,f);if(mid.to>=from&&mid.from<=to)f(mid);if(to>mid.to)this.right.forEachLine(mid.to+1,to,oracle,rightTop,rightOffset,f);}}replace(from,to,nodes){let rightStart=this.left.length+this.break;if(to<rightStart)return this.balanced(this.left.replace(from,to,nodes),this.right);if(from>this.left.length)return this.balanced(this.left,this.right.replace(from-rightStart,to-rightStart,nodes));let result=[];if(from>0)this.decomposeLeft(from,result);let left=result.length;for(let node of nodes)result.push(node);if(from>0)mergeGaps(result,left-1);if(to<this.length){let right=result.length;this.decomposeRight(to,result);mergeGaps(result,right);}return HeightMap.of(result);}decomposeLeft(to,result){let left=this.left.length;if(to<=left)return this.left.decomposeLeft(to,result);result.push(this.left);if(this.break){left++;if(to>=left)result.push(null);}if(to>left)this.right.decomposeLeft(to-left,result);}decomposeRight(from,result){let left=this.left.length,right=left+this.break;if(from>=right)return this.right.decomposeRight(from-right,result);if(from<left)this.left.decomposeRight(from,result);if(this.break&&from<right)result.push(null);result.push(this.right);}balanced(left,right){if(left.size>2*right.size||right.size>2*left.size)return HeightMap.of(this.break?[left,null,right]:[left,right]);this.left=left;this.right=right;this.height=left.height+right.height;this.outdated=left.outdated||right.outdated;this.size=left.size+right.size;this.length=left.length+this.break+right.length;return this;}updateHeight(oracle,offset=0,force=false,measured){let{left,right}=this,rightStart=offset+left.length+this.break,rebalance=null;if(measured&&measured.from<=offset+left.length&&measured.more)rebalance=left=left.updateHeight(oracle,offset,force,measured);else left.updateHeight(oracle,offset,force);if(measured&&measured.from<=rightStart+right.length&&measured.more)rebalance=right=right.updateHeight(oracle,rightStart,force,measured);else right.updateHeight(oracle,rightStart,force);if(rebalance)return this.balanced(left,right);this.height=this.left.height+this.right.height;this.outdated=false;return this;}toString(){return this.left+(this.break?" ":"-")+this.right;}}function mergeGaps(nodes,around){let before,after;if(nodes[around]==null&&(before=nodes[around-1])instanceof HeightMapGap&&(after=nodes[around+1])instanceof HeightMapGap)nodes.splice(around-1,3,new HeightMapGap(before.length+1+after.length));}const relevantWidgetHeight=5;class NodeBuilder{constructor(pos,oracle){this.pos=pos;this.oracle=oracle;this.nodes=[];this.lineStart=-1;this.lineEnd=-1;this.covering=null;this.writtenTo=pos;}get isCovered(){return this.covering&&this.nodes[this.nodes.length-1]==this.covering;}span(_from,to){if(this.lineStart>-1){let end=Math.min(to,this.lineEnd),last=this.nodes[this.nodes.length-1];if(last instanceof HeightMapText)last.length+=end-this.pos;else if(end>this.pos||!this.isCovered)this.nodes.push(new HeightMapText(end-this.pos,-1));this.writtenTo=end;if(to>end){this.nodes.push(null);this.writtenTo++;this.lineStart=-1;}}this.pos=to;}point(from,to,deco){if(from<to||deco.heightRelevant){let height=deco.widget?deco.widget.estimatedHeight:0;let breaks=deco.widget?deco.widget.lineBreaks:0;if(height<0)height=this.oracle.lineHeight;let len=to-from;if(deco.block){this.addBlock(new HeightMapBlock(len,height,deco));}else if(len||breaks||height>=relevantWidgetHeight){this.addLineDeco(height,breaks,len);}}else if(to>from){this.span(from,to);}if(this.lineEnd>-1&&this.lineEnd<this.pos)this.lineEnd=this.oracle.doc.lineAt(this.pos).to;}enterLine(){if(this.lineStart>-1)return;let{from,to}=this.oracle.doc.lineAt(this.pos);this.lineStart=from;this.lineEnd=to;if(this.writtenTo<from){if(this.writtenTo<from-1||this.nodes[this.nodes.length-1]==null)this.nodes.push(this.blankContent(this.writtenTo,from-1));this.nodes.push(null);}if(this.pos>from)this.nodes.push(new HeightMapText(this.pos-from,-1));this.writtenTo=this.pos;}blankContent(from,to){let gap=new HeightMapGap(to-from);if(this.oracle.doc.lineAt(from).to==to)gap.flags|=4/* Flag.SingleLine */;return gap;}ensureLine(){this.enterLine();let last=this.nodes.length?this.nodes[this.nodes.length-1]:null;if(last instanceof HeightMapText)return last;let line=new HeightMapText(0,-1);this.nodes.push(line);return line;}addBlock(block){this.enterLine();let deco=block.deco;if(deco&&deco.startSide>0&&!this.isCovered)this.ensureLine();this.nodes.push(block);this.writtenTo=this.pos=this.pos+block.length;if(deco&&deco.endSide>0)this.covering=block;}addLineDeco(height,breaks,length){let line=this.ensureLine();line.length+=length;line.collapsed+=length;line.widgetHeight=Math.max(line.widgetHeight,height);line.breaks+=breaks;this.writtenTo=this.pos=this.pos+length;}finish(from){let last=this.nodes.length==0?null:this.nodes[this.nodes.length-1];if(this.lineStart>-1&&!(last instanceof HeightMapText)&&!this.isCovered)this.nodes.push(new HeightMapText(0,-1));else if(this.writtenTo<this.pos||last==null)this.nodes.push(this.blankContent(this.writtenTo,this.pos));let pos=from;for(let node of this.nodes){if(node instanceof HeightMapText)node.updateHeight(this.oracle,pos);pos+=node?node.length:1;}return this.nodes;}// Always called with a region that on both sides either stretches
// to a line break or the end of the document.
// The returned array uses null to indicate line breaks, but never
// starts or ends in a line break, or has multiple line breaks next
// to each other.
static build(oracle,decorations,from,to){let builder=new NodeBuilder(from,oracle);RangeSet.spans(decorations,from,to,builder,0);return builder.finish(from);}}function heightRelevantDecoChanges(a,b,diff){let comp=new DecorationComparator();RangeSet.compare(a,b,diff,comp,0);return comp.changes;}class DecorationComparator{constructor(){this.changes=[];}compareRange(){}comparePoint(from,to,a,b){if(from<to||a&&a.heightRelevant||b&&b.heightRelevant)addRange(from,to,this.changes,5);}}function visiblePixelRange(dom,paddingTop){let rect=dom.getBoundingClientRect();let doc=dom.ownerDocument,win=doc.defaultView||window;let left=Math.max(0,rect.left),right=Math.min(win.innerWidth,rect.right);let top=Math.max(0,rect.top),bottom=Math.min(win.innerHeight,rect.bottom);for(let parent=dom.parentNode;parent&&parent!=doc.body;){if(parent.nodeType==1){let elt=parent;let style=window.getComputedStyle(elt);if((elt.scrollHeight>elt.clientHeight||elt.scrollWidth>elt.clientWidth)&&style.overflow!="visible"){let parentRect=elt.getBoundingClientRect();left=Math.max(left,parentRect.left);right=Math.min(right,parentRect.right);top=Math.max(top,parentRect.top);bottom=parent==dom.parentNode?parentRect.bottom:Math.min(bottom,parentRect.bottom);}parent=style.position=="absolute"||style.position=="fixed"?elt.offsetParent:elt.parentNode;}else if(parent.nodeType==11){// Shadow root
parent=parent.host;}else{break;}}return{left:left-rect.left,right:Math.max(left,right)-rect.left,top:top-(rect.top+paddingTop),bottom:Math.max(top,bottom)-(rect.top+paddingTop)};}function fullPixelRange(dom,paddingTop){let rect=dom.getBoundingClientRect();return{left:0,right:rect.right-rect.left,top:paddingTop,bottom:rect.bottom-(rect.top+paddingTop)};}// Line gaps are placeholder widgets used to hide pieces of overlong
// lines within the viewport, as a kludge to keep the editor
// responsive when a ridiculously long line is loaded into it.
class LineGap{constructor(from,to,size){this.from=from;this.to=to;this.size=size;}static same(a,b){if(a.length!=b.length)return false;for(let i=0;i<a.length;i++){let gA=a[i],gB=b[i];if(gA.from!=gB.from||gA.to!=gB.to||gA.size!=gB.size)return false;}return true;}draw(viewState,wrapping){return Decoration.replace({widget:new LineGapWidget(this.size*(wrapping?viewState.scaleY:viewState.scaleX),wrapping)}).range(this.from,this.to);}}class LineGapWidget extends WidgetType{constructor(size,vertical){super();this.size=size;this.vertical=vertical;}eq(other){return other.size==this.size&&other.vertical==this.vertical;}toDOM(){let elt=document.createElement("div");if(this.vertical){elt.style.height=this.size+"px";}else{elt.style.width=this.size+"px";elt.style.height="2px";elt.style.display="inline-block";}return elt;}get estimatedHeight(){return this.vertical?this.size:-1;}}class ViewState{constructor(state){this.state=state;// These are contentDOM-local coordinates
this.pixelViewport={left:0,right:window.innerWidth,top:0,bottom:0};this.inView=true;this.paddingTop=0;// Padding above the document, scaled
this.paddingBottom=0;// Padding below the document, scaled
this.contentDOMWidth=0;// contentDOM.getBoundingClientRect().width
this.contentDOMHeight=0;// contentDOM.getBoundingClientRect().height
this.editorHeight=0;// scrollDOM.clientHeight, unscaled
this.editorWidth=0;// scrollDOM.clientWidth, unscaled
this.scrollTop=0;// Last seen scrollDOM.scrollTop, scaled
this.scrolledToBottom=true;// The CSS-transformation scale of the editor (transformed size /
// concrete size)
this.scaleX=1;this.scaleY=1;// The vertical position (document-relative) to which to anchor the
// scroll position. -1 means anchor to the end of the document.
this.scrollAnchorPos=0;// The height at the anchor position. Set by the DOM update phase.
// -1 means no height available.
this.scrollAnchorHeight=-1;// See VP.MaxDOMHeight
this.scaler=IdScaler;this.scrollTarget=null;// Briefly set to true when printing, to disable viewport limiting
this.printing=false;// Flag set when editor content was redrawn, so that the next
// measure stage knows it must read DOM layout
this.mustMeasureContent=true;this.defaultTextDirection=Direction.LTR;this.visibleRanges=[];// Cursor 'assoc' is only significant when the cursor is on a line
// wrap point, where it must stick to the character that it is
// associated with. Since browsers don't provide a reasonable
// interface to set or query this, when a selection is set that
// might cause this to be significant, this flag is set. The next
// measure phase will check whether the cursor is on a line-wrapping
// boundary and, if so, reset it to make sure it is positioned in
// the right place.
this.mustEnforceCursorAssoc=false;let guessWrapping=state.facet(contentAttributes).some(v=>typeof v!="function"&&v.class=="cm-lineWrapping");this.heightOracle=new HeightOracle(guessWrapping);this.stateDeco=state.facet(decorations).filter(d=>typeof d!="function");this.heightMap=HeightMap.empty().applyChanges(this.stateDeco,Text.empty,this.heightOracle.setDoc(state.doc),[new ChangedRange(0,0,0,state.doc.length)]);this.viewport=this.getViewport(0,null);this.updateViewportLines();this.updateForViewport();this.lineGaps=this.ensureLineGaps([]);this.lineGapDeco=Decoration.set(this.lineGaps.map(gap=>gap.draw(this,false)));this.computeVisibleRanges();}updateForViewport(){let viewports=[this.viewport],{main}=this.state.selection;for(let i=0;i<=1;i++){let pos=i?main.head:main.anchor;if(!viewports.some(({from,to})=>pos>=from&&pos<=to)){let{from,to}=this.lineBlockAt(pos);viewports.push(new Viewport(from,to));}}this.viewports=viewports.sort((a,b)=>a.from-b.from);this.scaler=this.heightMap.height<=7000000/* VP.MaxDOMHeight */?IdScaler:new BigScaler(this.heightOracle,this.heightMap,this.viewports);}updateViewportLines(){this.viewportLines=[];this.heightMap.forEachLine(this.viewport.from,this.viewport.to,this.heightOracle.setDoc(this.state.doc),0,0,block=>{this.viewportLines.push(this.scaler.scale==1?block:scaleBlock(block,this.scaler));});}update(update,scrollTarget=null){this.state=update.state;let prevDeco=this.stateDeco;this.stateDeco=this.state.facet(decorations).filter(d=>typeof d!="function");let contentChanges=update.changedRanges;let heightChanges=ChangedRange.extendWithRanges(contentChanges,heightRelevantDecoChanges(prevDeco,this.stateDeco,update?update.changes:ChangeSet.empty(this.state.doc.length)));let prevHeight=this.heightMap.height;let scrollAnchor=this.scrolledToBottom?null:this.scrollAnchorAt(this.scrollTop);this.heightMap=this.heightMap.applyChanges(this.stateDeco,update.startState.doc,this.heightOracle.setDoc(this.state.doc),heightChanges);if(this.heightMap.height!=prevHeight)update.flags|=2/* UpdateFlag.Height */;if(scrollAnchor){this.scrollAnchorPos=update.changes.mapPos(scrollAnchor.from,-1);this.scrollAnchorHeight=scrollAnchor.top;}else{this.scrollAnchorPos=-1;this.scrollAnchorHeight=this.heightMap.height;}let viewport=heightChanges.length?this.mapViewport(this.viewport,update.changes):this.viewport;if(scrollTarget&&(scrollTarget.range.head<viewport.from||scrollTarget.range.head>viewport.to)||!this.viewportIsAppropriate(viewport))viewport=this.getViewport(0,scrollTarget);let updateLines=!update.changes.empty||update.flags&2/* UpdateFlag.Height */||viewport.from!=this.viewport.from||viewport.to!=this.viewport.to;this.viewport=viewport;this.updateForViewport();if(updateLines)this.updateViewportLines();if(this.lineGaps.length||this.viewport.to-this.viewport.from>2000/* LG.Margin */<<1)this.updateLineGaps(this.ensureLineGaps(this.mapLineGaps(this.lineGaps,update.changes)));update.flags|=this.computeVisibleRanges();if(scrollTarget)this.scrollTarget=scrollTarget;if(!this.mustEnforceCursorAssoc&&update.selectionSet&&update.view.lineWrapping&&update.state.selection.main.empty&&update.state.selection.main.assoc&&!update.state.facet(nativeSelectionHidden))this.mustEnforceCursorAssoc=true;}measure(view){let dom=view.contentDOM,style=window.getComputedStyle(dom);let oracle=this.heightOracle;let whiteSpace=style.whiteSpace;this.defaultTextDirection=style.direction=="rtl"?Direction.RTL:Direction.LTR;let refresh=this.heightOracle.mustRefreshForWrapping(whiteSpace);let domRect=dom.getBoundingClientRect();let measureContent=refresh||this.mustMeasureContent||this.contentDOMHeight!=domRect.height;this.contentDOMHeight=domRect.height;this.mustMeasureContent=false;let result=0,bias=0;if(domRect.width&&domRect.height){let{scaleX,scaleY}=getScale(dom,domRect);if(this.scaleX!=scaleX||this.scaleY!=scaleY){this.scaleX=scaleX;this.scaleY=scaleY;result|=8/* UpdateFlag.Geometry */;refresh=measureContent=true;}}// Vertical padding
let paddingTop=(parseInt(style.paddingTop)||0)*this.scaleY;let paddingBottom=(parseInt(style.paddingBottom)||0)*this.scaleY;if(this.paddingTop!=paddingTop||this.paddingBottom!=paddingBottom){this.paddingTop=paddingTop;this.paddingBottom=paddingBottom;result|=8/* UpdateFlag.Geometry */|2/* UpdateFlag.Height */;}if(this.editorWidth!=view.scrollDOM.clientWidth){if(oracle.lineWrapping)measureContent=true;this.editorWidth=view.scrollDOM.clientWidth;result|=8/* UpdateFlag.Geometry */;}let scrollTop=view.scrollDOM.scrollTop*this.scaleY;if(this.scrollTop!=scrollTop){this.scrollAnchorHeight=-1;this.scrollTop=scrollTop;}this.scrolledToBottom=isScrolledToBottom(view.scrollDOM);// Pixel viewport
let pixelViewport=(this.printing?fullPixelRange:visiblePixelRange)(dom,this.paddingTop);let dTop=pixelViewport.top-this.pixelViewport.top,dBottom=pixelViewport.bottom-this.pixelViewport.bottom;this.pixelViewport=pixelViewport;let inView=this.pixelViewport.bottom>this.pixelViewport.top&&this.pixelViewport.right>this.pixelViewport.left;if(inView!=this.inView){this.inView=inView;if(inView)measureContent=true;}if(!this.inView&&!this.scrollTarget)return 0;let contentWidth=domRect.width;if(this.contentDOMWidth!=contentWidth||this.editorHeight!=view.scrollDOM.clientHeight){this.contentDOMWidth=domRect.width;this.editorHeight=view.scrollDOM.clientHeight;result|=8/* UpdateFlag.Geometry */;}if(measureContent){let lineHeights=view.docView.measureVisibleLineHeights(this.viewport);if(oracle.mustRefreshForHeights(lineHeights))refresh=true;if(refresh||oracle.lineWrapping&&Math.abs(contentWidth-this.contentDOMWidth)>oracle.charWidth){let{lineHeight,charWidth,textHeight}=view.docView.measureTextSize();refresh=lineHeight>0&&oracle.refresh(whiteSpace,lineHeight,charWidth,textHeight,contentWidth/charWidth,lineHeights);if(refresh){view.docView.minWidth=0;result|=8/* UpdateFlag.Geometry */;}}if(dTop>0&&dBottom>0)bias=Math.max(dTop,dBottom);else if(dTop<0&&dBottom<0)bias=Math.min(dTop,dBottom);oracle.heightChanged=false;for(let vp of this.viewports){let heights=vp.from==this.viewport.from?lineHeights:view.docView.measureVisibleLineHeights(vp);this.heightMap=(refresh?HeightMap.empty().applyChanges(this.stateDeco,Text.empty,this.heightOracle,[new ChangedRange(0,0,0,view.state.doc.length)]):this.heightMap).updateHeight(oracle,0,refresh,new MeasuredHeights(vp.from,heights));}if(oracle.heightChanged)result|=2/* UpdateFlag.Height */;}let viewportChange=!this.viewportIsAppropriate(this.viewport,bias)||this.scrollTarget&&(this.scrollTarget.range.head<this.viewport.from||this.scrollTarget.range.head>this.viewport.to);if(viewportChange)this.viewport=this.getViewport(bias,this.scrollTarget);this.updateForViewport();if(result&2/* UpdateFlag.Height */||viewportChange)this.updateViewportLines();if(this.lineGaps.length||this.viewport.to-this.viewport.from>2000/* LG.Margin */<<1)this.updateLineGaps(this.ensureLineGaps(refresh?[]:this.lineGaps,view));result|=this.computeVisibleRanges();if(this.mustEnforceCursorAssoc){this.mustEnforceCursorAssoc=false;// This is done in the read stage, because moving the selection
// to a line end is going to trigger a layout anyway, so it
// can't be a pure write. It should be rare that it does any
// writing.
view.docView.enforceCursorAssoc();}return result;}get visibleTop(){return this.scaler.fromDOM(this.pixelViewport.top);}get visibleBottom(){return this.scaler.fromDOM(this.pixelViewport.bottom);}getViewport(bias,scrollTarget){// This will divide VP.Margin between the top and the
// bottom, depending on the bias (the change in viewport position
// since the last update). It'll hold a number between 0 and 1
let marginTop=0.5-Math.max(-0.5,Math.min(0.5,bias/1000/* VP.Margin *//2));let map=this.heightMap,oracle=this.heightOracle;let{visibleTop,visibleBottom}=this;let viewport=new Viewport(map.lineAt(visibleTop-marginTop*1000/* VP.Margin */,QueryType$1.ByHeight,oracle,0,0).from,map.lineAt(visibleBottom+(1-marginTop)*1000/* VP.Margin */,QueryType$1.ByHeight,oracle,0,0).to);// If scrollTarget is given, make sure the viewport includes that position
if(scrollTarget){let{head}=scrollTarget.range;if(head<viewport.from||head>viewport.to){let viewHeight=Math.min(this.editorHeight,this.pixelViewport.bottom-this.pixelViewport.top);let block=map.lineAt(head,QueryType$1.ByPos,oracle,0,0),topPos;if(scrollTarget.y=="center")topPos=(block.top+block.bottom)/2-viewHeight/2;else if(scrollTarget.y=="start"||scrollTarget.y=="nearest"&&head<viewport.from)topPos=block.top;else topPos=block.bottom-viewHeight;viewport=new Viewport(map.lineAt(topPos-1000/* VP.Margin *//2,QueryType$1.ByHeight,oracle,0,0).from,map.lineAt(topPos+viewHeight+1000/* VP.Margin *//2,QueryType$1.ByHeight,oracle,0,0).to);}}return viewport;}mapViewport(viewport,changes){let from=changes.mapPos(viewport.from,-1),to=changes.mapPos(viewport.to,1);return new Viewport(this.heightMap.lineAt(from,QueryType$1.ByPos,this.heightOracle,0,0).from,this.heightMap.lineAt(to,QueryType$1.ByPos,this.heightOracle,0,0).to);}// Checks if a given viewport covers the visible part of the
// document and not too much beyond that.
viewportIsAppropriate({from,to},bias=0){if(!this.inView)return true;let{top}=this.heightMap.lineAt(from,QueryType$1.ByPos,this.heightOracle,0,0);let{bottom}=this.heightMap.lineAt(to,QueryType$1.ByPos,this.heightOracle,0,0);let{visibleTop,visibleBottom}=this;return(from==0||top<=visibleTop-Math.max(10/* VP.MinCoverMargin */,Math.min(-bias,250/* VP.MaxCoverMargin */)))&&(to==this.state.doc.length||bottom>=visibleBottom+Math.max(10/* VP.MinCoverMargin */,Math.min(bias,250/* VP.MaxCoverMargin */)))&&top>visibleTop-2*1000/* VP.Margin */&&bottom<visibleBottom+2*1000/* VP.Margin */;}mapLineGaps(gaps,changes){if(!gaps.length||changes.empty)return gaps;let mapped=[];for(let gap of gaps)if(!changes.touchesRange(gap.from,gap.to))mapped.push(new LineGap(changes.mapPos(gap.from),changes.mapPos(gap.to),gap.size));return mapped;}// Computes positions in the viewport where the start or end of a
// line should be hidden, trying to reuse existing line gaps when
// appropriate to avoid unneccesary redraws.
// Uses crude character-counting for the positioning and sizing,
// since actual DOM coordinates aren't always available and
// predictable. Relies on generous margins (see LG.Margin) to hide
// the artifacts this might produce from the user.
ensureLineGaps(current,mayMeasure){let wrapping=this.heightOracle.lineWrapping;let margin=wrapping?10000/* LG.MarginWrap */:2000/* LG.Margin */,halfMargin=margin>>1,doubleMargin=margin<<1;// The non-wrapping logic won't work at all in predominantly right-to-left text.
if(this.defaultTextDirection!=Direction.LTR&&!wrapping)return[];let gaps=[];let addGap=(from,to,line,structure)=>{if(to-from<halfMargin)return;let sel=this.state.selection.main,avoid=[sel.from];if(!sel.empty)avoid.push(sel.to);for(let pos of avoid){if(pos>from&&pos<to){addGap(from,pos-10/* LG.SelectionMargin */,line,structure);addGap(pos+10/* LG.SelectionMargin */,to,line,structure);return;}}let gap=find(current,gap=>gap.from>=line.from&&gap.to<=line.to&&Math.abs(gap.from-from)<halfMargin&&Math.abs(gap.to-to)<halfMargin&&!avoid.some(pos=>gap.from<pos&&gap.to>pos));if(!gap){// When scrolling down, snap gap ends to line starts to avoid shifts in wrapping
if(to<line.to&&mayMeasure&&wrapping&&mayMeasure.visibleRanges.some(r=>r.from<=to&&r.to>=to)){let lineStart=mayMeasure.moveToLineBoundary(EditorSelection.cursor(to),false,true).head;if(lineStart>from)to=lineStart;}gap=new LineGap(from,to,this.gapSize(line,from,to,structure));}gaps.push(gap);};for(let line of this.viewportLines){if(line.length<doubleMargin)continue;let structure=lineStructure(line.from,line.to,this.stateDeco);if(structure.total<doubleMargin)continue;let target=this.scrollTarget?this.scrollTarget.range.head:null;let viewFrom,viewTo;if(wrapping){let marginHeight=margin/this.heightOracle.lineLength*this.heightOracle.lineHeight;let top,bot;if(target!=null){let targetFrac=findFraction(structure,target);let spaceFrac=((this.visibleBottom-this.visibleTop)/2+marginHeight)/line.height;top=targetFrac-spaceFrac;bot=targetFrac+spaceFrac;}else{top=(this.visibleTop-line.top-marginHeight)/line.height;bot=(this.visibleBottom-line.top+marginHeight)/line.height;}viewFrom=findPosition(structure,top);viewTo=findPosition(structure,bot);}else{let totalWidth=structure.total*this.heightOracle.charWidth;let marginWidth=margin*this.heightOracle.charWidth;let left,right;if(target!=null){let targetFrac=findFraction(structure,target);let spaceFrac=((this.pixelViewport.right-this.pixelViewport.left)/2+marginWidth)/totalWidth;left=targetFrac-spaceFrac;right=targetFrac+spaceFrac;}else{left=(this.pixelViewport.left-marginWidth)/totalWidth;right=(this.pixelViewport.right+marginWidth)/totalWidth;}viewFrom=findPosition(structure,left);viewTo=findPosition(structure,right);}if(viewFrom>line.from)addGap(line.from,viewFrom,line,structure);if(viewTo<line.to)addGap(viewTo,line.to,line,structure);}return gaps;}gapSize(line,from,to,structure){let fraction=findFraction(structure,to)-findFraction(structure,from);if(this.heightOracle.lineWrapping){return line.height*fraction;}else{return structure.total*this.heightOracle.charWidth*fraction;}}updateLineGaps(gaps){if(!LineGap.same(gaps,this.lineGaps)){this.lineGaps=gaps;this.lineGapDeco=Decoration.set(gaps.map(gap=>gap.draw(this,this.heightOracle.lineWrapping)));}}computeVisibleRanges(){let deco=this.stateDeco;if(this.lineGaps.length)deco=deco.concat(this.lineGapDeco);let ranges=[];RangeSet.spans(deco,this.viewport.from,this.viewport.to,{span(from,to){ranges.push({from,to});},point(){}},20);let changed=ranges.length!=this.visibleRanges.length||this.visibleRanges.some((r,i)=>r.from!=ranges[i].from||r.to!=ranges[i].to);this.visibleRanges=ranges;return changed?4/* UpdateFlag.Viewport */:0;}lineBlockAt(pos){return pos>=this.viewport.from&&pos<=this.viewport.to&&this.viewportLines.find(b=>b.from<=pos&&b.to>=pos)||scaleBlock(this.heightMap.lineAt(pos,QueryType$1.ByPos,this.heightOracle,0,0),this.scaler);}lineBlockAtHeight(height){return scaleBlock(this.heightMap.lineAt(this.scaler.fromDOM(height),QueryType$1.ByHeight,this.heightOracle,0,0),this.scaler);}scrollAnchorAt(scrollTop){let block=this.lineBlockAtHeight(scrollTop+8);return block.from>=this.viewport.from||this.viewportLines[0].top-scrollTop>200?block:this.viewportLines[0];}elementAtHeight(height){return scaleBlock(this.heightMap.blockAt(this.scaler.fromDOM(height),this.heightOracle,0,0),this.scaler);}get docHeight(){return this.scaler.toDOM(this.heightMap.height);}get contentHeight(){return this.docHeight+this.paddingTop+this.paddingBottom;}}class Viewport{constructor(from,to){this.from=from;this.to=to;}}function lineStructure(from,to,stateDeco){let ranges=[],pos=from,total=0;RangeSet.spans(stateDeco,from,to,{span(){},point(from,to){if(from>pos){ranges.push({from:pos,to:from});total+=from-pos;}pos=to;}},20);// We're only interested in collapsed ranges of a significant size
if(pos<to){ranges.push({from:pos,to});total+=to-pos;}return{total,ranges};}function findPosition({total,ranges},ratio){if(ratio<=0)return ranges[0].from;if(ratio>=1)return ranges[ranges.length-1].to;let dist=Math.floor(total*ratio);for(let i=0;;i++){let{from,to}=ranges[i],size=to-from;if(dist<=size)return from+dist;dist-=size;}}function findFraction(structure,pos){let counted=0;for(let{from,to}of structure.ranges){if(pos<=to){counted+=pos-from;break;}counted+=to-from;}return counted/structure.total;}function find(array,f){for(let val of array)if(f(val))return val;return undefined;}// Don't scale when the document height is within the range of what
// the DOM can handle.
const IdScaler={toDOM(n){return n;},fromDOM(n){return n;},scale:1};// When the height is too big (> VP.MaxDOMHeight), scale down the
// regions outside the viewports so that the total height is
// VP.MaxDOMHeight.
class BigScaler{constructor(oracle,heightMap,viewports){let vpHeight=0,base=0,domBase=0;this.viewports=viewports.map(({from,to})=>{let top=heightMap.lineAt(from,QueryType$1.ByPos,oracle,0,0).top;let bottom=heightMap.lineAt(to,QueryType$1.ByPos,oracle,0,0).bottom;vpHeight+=bottom-top;return{from,to,top,bottom,domTop:0,domBottom:0};});this.scale=(7000000/* VP.MaxDOMHeight */-vpHeight)/(heightMap.height-vpHeight);for(let obj of this.viewports){obj.domTop=domBase+(obj.top-base)*this.scale;domBase=obj.domBottom=obj.domTop+(obj.bottom-obj.top);base=obj.bottom;}}toDOM(n){for(let i=0,base=0,domBase=0;;i++){let vp=i<this.viewports.length?this.viewports[i]:null;if(!vp||n<vp.top)return domBase+(n-base)*this.scale;if(n<=vp.bottom)return vp.domTop+(n-vp.top);base=vp.bottom;domBase=vp.domBottom;}}fromDOM(n){for(let i=0,base=0,domBase=0;;i++){let vp=i<this.viewports.length?this.viewports[i]:null;if(!vp||n<vp.domTop)return base+(n-domBase)/this.scale;if(n<=vp.domBottom)return vp.top+(n-vp.domTop);base=vp.bottom;domBase=vp.domBottom;}}}function scaleBlock(block,scaler){if(scaler.scale==1)return block;let bTop=scaler.toDOM(block.top),bBottom=scaler.toDOM(block.bottom);return new BlockInfo(block.from,block.length,bTop,bBottom-bTop,Array.isArray(block._content)?block._content.map(b=>scaleBlock(b,scaler)):block._content);}const theme=/*@__PURE__*/Facet.define({combine:strs=>strs.join(" ")});const darkTheme=/*@__PURE__*/Facet.define({combine:values=>values.indexOf(true)>-1});const baseThemeID=/*@__PURE__*/StyleModule.newName(),baseLightID=/*@__PURE__*/StyleModule.newName(),baseDarkID=/*@__PURE__*/StyleModule.newName();const lightDarkIDs={"&light":"."+baseLightID,"&dark":"."+baseDarkID};function buildTheme(main,spec,scopes){return new StyleModule(spec,{finish(sel){return /&/.test(sel)?sel.replace(/&\w*/,m=>{if(m=="&")return main;if(!scopes||!scopes[m])throw new RangeError(`Unsupported selector: ${m}`);return scopes[m];}):main+" "+sel;}});}const baseTheme$1$3=/*@__PURE__*/buildTheme("."+baseThemeID,{"&":{position:"relative !important",boxSizing:"border-box","&.cm-focused":{// Provide a simple default outline to make sure a focused
// editor is visually distinct. Can't leave the default behavior
// because that will apply to the content element, which is
// inside the scrollable container and doesn't include the
// gutters. We also can't use an 'auto' outline, since those
// are, for some reason, drawn behind the element content, which
// will cause things like the active line background to cover
// the outline (#297).
outline:"1px dotted #212121"},display:"flex !important",flexDirection:"column"},".cm-scroller":{display:"flex !important",alignItems:"flex-start !important",fontFamily:"monospace",lineHeight:1.4,height:"100%",overflowX:"auto",position:"relative",zIndex:0},".cm-content":{margin:0,flexGrow:2,flexShrink:0,display:"block",whiteSpace:"pre",wordWrap:"normal",// https://github.com/codemirror/dev/issues/456
boxSizing:"border-box",minHeight:"100%",padding:"4px 0",outline:"none","&[contenteditable=true]":{WebkitUserModify:"read-write-plaintext-only"}},".cm-lineWrapping":{whiteSpace_fallback:"pre-wrap",// For IE
whiteSpace:"break-spaces",wordBreak:"break-word",// For Safari, which doesn't support overflow-wrap: anywhere
overflowWrap:"anywhere",flexShrink:1},"&light .cm-content":{caretColor:"black"},"&dark .cm-content":{caretColor:"white"},".cm-line":{display:"block",padding:"0 2px 0 6px"},".cm-layer":{position:"absolute",left:0,top:0,contain:"size style","& > *":{position:"absolute"}},"&light .cm-selectionBackground":{background:"#d9d9d9"},"&dark .cm-selectionBackground":{background:"#222"},"&light.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":{background:"#d7d4f0"},"&dark.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":{background:"#233"},".cm-cursorLayer":{pointerEvents:"none"},"&.cm-focused > .cm-scroller > .cm-cursorLayer":{animation:"steps(1) cm-blink 1.2s infinite"},// Two animations defined so that we can switch between them to
// restart the animation without forcing another style
// recomputation.
"@keyframes cm-blink":{"0%":{},"50%":{opacity:0},"100%":{}},"@keyframes cm-blink2":{"0%":{},"50%":{opacity:0},"100%":{}},".cm-cursor, .cm-dropCursor":{borderLeft:"1.2px solid black",marginLeft:"-0.6px",pointerEvents:"none"},".cm-cursor":{display:"none"},"&dark .cm-cursor":{borderLeftColor:"#444"},".cm-dropCursor":{position:"absolute"},"&.cm-focused > .cm-scroller > .cm-cursorLayer .cm-cursor":{display:"block"},".cm-iso":{unicodeBidi:"isolate"},".cm-announced":{position:"fixed",top:"-10000px"},"@media print":{".cm-announced":{display:"none"}},"&light .cm-activeLine":{backgroundColor:"#cceeff44"},"&dark .cm-activeLine":{backgroundColor:"#99eeff33"},"&light .cm-specialChar":{color:"red"},"&dark .cm-specialChar":{color:"#f78"},".cm-gutters":{flexShrink:0,display:"flex",height:"100%",boxSizing:"border-box",insetInlineStart:0,zIndex:200},"&light .cm-gutters":{backgroundColor:"#f5f5f5",color:"#6c6c6c",borderRight:"1px solid #ddd"},"&dark .cm-gutters":{backgroundColor:"#333338",color:"#ccc"},".cm-gutter":{display:"flex !important",// Necessary -- prevents margin collapsing
flexDirection:"column",flexShrink:0,boxSizing:"border-box",minHeight:"100%",overflow:"hidden"},".cm-gutterElement":{boxSizing:"border-box"},".cm-lineNumbers .cm-gutterElement":{padding:"0 3px 0 5px",minWidth:"20px",textAlign:"right",whiteSpace:"nowrap"},"&light .cm-activeLineGutter":{backgroundColor:"#e2f2ff"},"&dark .cm-activeLineGutter":{backgroundColor:"#222227"},".cm-panels":{boxSizing:"border-box",position:"sticky",left:0,right:0},"&light .cm-panels":{backgroundColor:"#f5f5f5",color:"black"},"&light .cm-panels-top":{borderBottom:"1px solid #ddd"},"&light .cm-panels-bottom":{borderTop:"1px solid #ddd"},"&dark .cm-panels":{backgroundColor:"#333338",color:"white"},".cm-tab":{display:"inline-block",overflow:"hidden",verticalAlign:"bottom"},".cm-widgetBuffer":{verticalAlign:"text-top",height:"1em",width:0,display:"inline"},".cm-placeholder":{color:"#888",display:"inline-block",verticalAlign:"top"},".cm-highlightSpace:before":{content:"attr(data-display)",position:"absolute",pointerEvents:"none",color:"#888"},".cm-highlightTab":{backgroundImage:`url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20"><path stroke="%23888" stroke-width="1" fill="none" d="M1 10H196L190 5M190 15L196 10M197 4L197 16"/></svg>')`,backgroundSize:"auto 100%",backgroundPosition:"right 90%",backgroundRepeat:"no-repeat"},".cm-trailingSpace":{backgroundColor:"#ff332255"},".cm-button":{verticalAlign:"middle",color:"inherit",fontSize:"70%",padding:".2em 1em",borderRadius:"1px"},"&light .cm-button":{backgroundImage:"linear-gradient(#eff1f5, #d9d9df)",border:"1px solid #888","&:active":{backgroundImage:"linear-gradient(#b4b4b4, #d0d3d6)"}},"&dark .cm-button":{backgroundImage:"linear-gradient(#393939, #111)",border:"1px solid #888","&:active":{backgroundImage:"linear-gradient(#111, #333)"}},".cm-textfield":{verticalAlign:"middle",color:"inherit",fontSize:"70%",border:"1px solid silver",padding:".2em .5em"},"&light .cm-textfield":{backgroundColor:"white"},"&dark .cm-textfield":{border:"1px solid #555",backgroundColor:"inherit"}},lightDarkIDs);const LineBreakPlaceholder="\uffff";class DOMReader{constructor(points,state){this.points=points;this.text="";this.lineSeparator=state.facet(EditorState.lineSeparator);}append(text){this.text+=text;}lineBreak(){this.text+=LineBreakPlaceholder;}readRange(start,end){if(!start)return this;let parent=start.parentNode;for(let cur=start;;){this.findPointBefore(parent,cur);let oldLen=this.text.length;this.readNode(cur);let next=cur.nextSibling;if(next==end)break;let view=ContentView.get(cur),nextView=ContentView.get(next);if(view&&nextView?view.breakAfter:(view?view.breakAfter:isBlockElement(cur))||isBlockElement(next)&&(cur.nodeName!="BR"||cur.cmIgnore)&&this.text.length>oldLen)this.lineBreak();cur=next;}this.findPointBefore(parent,end);return this;}readTextNode(node){let text=node.nodeValue;for(let point of this.points)if(point.node==node)point.pos=this.text.length+Math.min(point.offset,text.length);for(let off=0,re=this.lineSeparator?null:/\r\n?|\n/g;;){let nextBreak=-1,breakSize=1,m;if(this.lineSeparator){nextBreak=text.indexOf(this.lineSeparator,off);breakSize=this.lineSeparator.length;}else if(m=re.exec(text)){nextBreak=m.index;breakSize=m[0].length;}this.append(text.slice(off,nextBreak<0?text.length:nextBreak));if(nextBreak<0)break;this.lineBreak();if(breakSize>1)for(let point of this.points)if(point.node==node&&point.pos>this.text.length)point.pos-=breakSize-1;off=nextBreak+breakSize;}}readNode(node){if(node.cmIgnore)return;let view=ContentView.get(node);let fromView=view&&view.overrideDOMText;if(fromView!=null){this.findPointInside(node,fromView.length);for(let i=fromView.iter();!i.next().done;){if(i.lineBreak)this.lineBreak();else this.append(i.value);}}else if(node.nodeType==3){this.readTextNode(node);}else if(node.nodeName=="BR"){if(node.nextSibling)this.lineBreak();}else if(node.nodeType==1){this.readRange(node.firstChild,null);}}findPointBefore(node,next){for(let point of this.points)if(point.node==node&&node.childNodes[point.offset]==next)point.pos=this.text.length;}findPointInside(node,length){for(let point of this.points)if(node.nodeType==3?point.node==node:node.contains(point.node))point.pos=this.text.length+(isAtEnd(node,point.node,point.offset)?length:0);}}function isAtEnd(parent,node,offset){for(;;){if(!node||offset<maxOffset(node))return false;if(node==parent)return true;offset=domIndex(node)+1;node=node.parentNode;}}function isBlockElement(node){return node.nodeType==1&&/^(DIV|P|LI|UL|OL|BLOCKQUOTE|DD|DT|H\d|SECTION|PRE)$/.test(node.nodeName);}class DOMPoint{constructor(node,offset){this.node=node;this.offset=offset;this.pos=-1;}}class DOMChange{constructor(view,start,end,typeOver){this.typeOver=typeOver;this.bounds=null;this.text="";let{impreciseHead:iHead,impreciseAnchor:iAnchor}=view.docView;if(view.state.readOnly&&start>-1){// Ignore changes when the editor is read-only
this.newSel=null;}else if(start>-1&&(this.bounds=view.docView.domBoundsAround(start,end,0))){let selPoints=iHead||iAnchor?[]:selectionPoints(view);let reader=new DOMReader(selPoints,view.state);reader.readRange(this.bounds.startDOM,this.bounds.endDOM);this.text=reader.text;this.newSel=selectionFromPoints(selPoints,this.bounds.from);}else{let domSel=view.observer.selectionRange;let head=iHead&&iHead.node==domSel.focusNode&&iHead.offset==domSel.focusOffset||!contains(view.contentDOM,domSel.focusNode)?view.state.selection.main.head:view.docView.posFromDOM(domSel.focusNode,domSel.focusOffset);let anchor=iAnchor&&iAnchor.node==domSel.anchorNode&&iAnchor.offset==domSel.anchorOffset||!contains(view.contentDOM,domSel.anchorNode)?view.state.selection.main.anchor:view.docView.posFromDOM(domSel.anchorNode,domSel.anchorOffset);// iOS will refuse to select the block gaps when doing
// select-all.
// Chrome will put the selection *inside* them, confusing
// posFromDOM
let vp=view.viewport;if((browser.ios||browser.chrome)&&view.state.selection.main.empty&&head!=anchor&&(vp.from>0||vp.to<view.state.doc.length)){let from=Math.min(head,anchor),to=Math.max(head,anchor);let offFrom=vp.from-from,offTo=vp.to-to;if((offFrom==0||offFrom==1||from==0)&&(offTo==0||offTo==-1||to==view.state.doc.length)){head=0;anchor=view.state.doc.length;}}this.newSel=EditorSelection.single(anchor,head);}}}function applyDOMChange(view,domChange){let change;let{newSel}=domChange,sel=view.state.selection.main;let lastKey=view.inputState.lastKeyTime>Date.now()-100?view.inputState.lastKeyCode:-1;if(domChange.bounds){let{from,to}=domChange.bounds;let preferredPos=sel.from,preferredSide=null;// Prefer anchoring to end when Backspace is pressed (or, on
// Android, when something was deleted)
if(lastKey===8||browser.android&&domChange.text.length<to-from){preferredPos=sel.to;preferredSide="end";}let diff=findDiff(view.state.doc.sliceString(from,to,LineBreakPlaceholder),domChange.text,preferredPos-from,preferredSide);if(diff){// Chrome inserts two newlines when pressing shift-enter at the
// end of a line. DomChange drops one of those.
if(browser.chrome&&lastKey==13&&diff.toB==diff.from+2&&domChange.text.slice(diff.from,diff.toB)==LineBreakPlaceholder+LineBreakPlaceholder)diff.toB--;change={from:from+diff.from,to:from+diff.toA,insert:Text.of(domChange.text.slice(diff.from,diff.toB).split(LineBreakPlaceholder))};}}else if(newSel&&(!view.hasFocus&&view.state.facet(editable)||newSel.main.eq(sel))){newSel=null;}if(!change&&!newSel)return false;if(!change&&domChange.typeOver&&!sel.empty&&newSel&&newSel.main.empty){// Heuristic to notice typing over a selected character
change={from:sel.from,to:sel.to,insert:view.state.doc.slice(sel.from,sel.to)};}else if(change&&change.from>=sel.from&&change.to<=sel.to&&(change.from!=sel.from||change.to!=sel.to)&&sel.to-sel.from-(change.to-change.from)<=4){// If the change is inside the selection and covers most of it,
// assume it is a selection replace (with identical characters at
// the start/end not included in the diff)
change={from:sel.from,to:sel.to,insert:view.state.doc.slice(sel.from,change.from).append(change.insert).append(view.state.doc.slice(change.to,sel.to))};}else if((browser.mac||browser.android)&&change&&change.from==change.to&&change.from==sel.head-1&&/^\. ?$/.test(change.insert.toString())&&view.contentDOM.getAttribute("autocorrect")=="off"){// Detect insert-period-on-double-space Mac and Android behavior,
// and transform it into a regular space insert.
if(newSel&&change.insert.length==2)newSel=EditorSelection.single(newSel.main.anchor-1,newSel.main.head-1);change={from:sel.from,to:sel.to,insert:Text.of([" "])};}else if(browser.chrome&&change&&change.from==change.to&&change.from==sel.head&&change.insert.toString()=="\n "&&view.lineWrapping){// In Chrome, if you insert a space at the start of a wrapped
// line, it will actually insert a newline and a space, causing a
// bogus new line to be created in CodeMirror (#968)
if(newSel)newSel=EditorSelection.single(newSel.main.anchor-1,newSel.main.head-1);change={from:sel.from,to:sel.to,insert:Text.of([" "])};}if(change){if(browser.ios&&view.inputState.flushIOSKey())return true;// Android browsers don't fire reasonable key events for enter,
// backspace, or delete. So this detects changes that look like
// they're caused by those keys, and reinterprets them as key
// events. (Some of these keys are also handled by beforeinput
// events and the pendingAndroidKey mechanism, but that's not
// reliable in all situations.)
if(browser.android&&(change.to==sel.to&&(// GBoard will sometimes remove a space it just inserted
// after a completion when you press enter
change.from==sel.from||change.from==sel.from-1&&view.state.sliceDoc(change.from,sel.from)==" ")&&change.insert.length==1&&change.insert.lines==2&&dispatchKey(view.contentDOM,"Enter",13)||(change.from==sel.from-1&&change.to==sel.to&&change.insert.length==0||lastKey==8&&change.insert.length<change.to-change.from&&change.to>sel.head)&&dispatchKey(view.contentDOM,"Backspace",8)||change.from==sel.from&&change.to==sel.to+1&&change.insert.length==0&&dispatchKey(view.contentDOM,"Delete",46)))return true;let text=change.insert.toString();if(view.inputState.composing>=0)view.inputState.composing++;let defaultTr;let defaultInsert=()=>defaultTr||(defaultTr=applyDefaultInsert(view,change,newSel));if(!view.state.facet(inputHandler$1).some(h=>h(view,change.from,change.to,text,defaultInsert)))view.dispatch(defaultInsert());return true;}else if(newSel&&!newSel.main.eq(sel)){let scrollIntoView=false,userEvent="select";if(view.inputState.lastSelectionTime>Date.now()-50){if(view.inputState.lastSelectionOrigin=="select")scrollIntoView=true;userEvent=view.inputState.lastSelectionOrigin;}view.dispatch({selection:newSel,scrollIntoView,userEvent});return true;}else{return false;}}function applyDefaultInsert(view,change,newSel){let tr,startState=view.state,sel=startState.selection.main;if(change.from>=sel.from&&change.to<=sel.to&&change.to-change.from>=(sel.to-sel.from)/3&&(!newSel||newSel.main.empty&&newSel.main.from==change.from+change.insert.length)&&view.inputState.composing<0){let before=sel.from<change.from?startState.sliceDoc(sel.from,change.from):"";let after=sel.to>change.to?startState.sliceDoc(change.to,sel.to):"";tr=startState.replaceSelection(view.state.toText(before+change.insert.sliceString(0,undefined,view.state.lineBreak)+after));}else{let changes=startState.changes(change);let mainSel=newSel&&newSel.main.to<=changes.newLength?newSel.main:undefined;// Try to apply a composition change to all cursors
if(startState.selection.ranges.length>1&&view.inputState.composing>=0&&change.to<=sel.to&&change.to>=sel.to-10){let replaced=view.state.sliceDoc(change.from,change.to);let compositionRange,composition=newSel&&findCompositionNode(view,newSel.main.head);if(composition){let dLen=change.insert.length-(change.to-change.from);compositionRange={from:composition.from,to:composition.to-dLen};}else{compositionRange=view.state.doc.lineAt(sel.head);}let offset=sel.to-change.to,size=sel.to-sel.from;tr=startState.changeByRange(range=>{if(range.from==sel.from&&range.to==sel.to)return{changes,range:mainSel||range.map(changes)};let to=range.to-offset,from=to-replaced.length;if(range.to-range.from!=size||view.state.sliceDoc(from,to)!=replaced||// Unfortunately, there's no way to make multiple
// changes in the same node work without aborting
// composition, so cursors in the composition range are
// ignored.
range.to>=compositionRange.from&&range.from<=compositionRange.to)return{range};let rangeChanges=startState.changes({from,to,insert:change.insert}),selOff=range.to-sel.to;return{changes:rangeChanges,range:!mainSel?range.map(rangeChanges):EditorSelection.range(Math.max(0,mainSel.anchor+selOff),Math.max(0,mainSel.head+selOff))};});}else{tr={changes,selection:mainSel&&startState.selection.replaceRange(mainSel)};}}let userEvent="input.type";if(view.composing||view.inputState.compositionPendingChange&&view.inputState.compositionEndedAt>Date.now()-50){view.inputState.compositionPendingChange=false;userEvent+=".compose";if(view.inputState.compositionFirstChange){userEvent+=".start";view.inputState.compositionFirstChange=false;}}return startState.update(tr,{userEvent,scrollIntoView:true});}function findDiff(a,b,preferredPos,preferredSide){let minLen=Math.min(a.length,b.length);let from=0;while(from<minLen&&a.charCodeAt(from)==b.charCodeAt(from))from++;if(from==minLen&&a.length==b.length)return null;let toA=a.length,toB=b.length;while(toA>0&&toB>0&&a.charCodeAt(toA-1)==b.charCodeAt(toB-1)){toA--;toB--;}if(preferredSide=="end"){let adjust=Math.max(0,from-Math.min(toA,toB));preferredPos-=toA+adjust-from;}if(toA<from&&a.length<b.length){let move=preferredPos<=from&&preferredPos>=toA?from-preferredPos:0;from-=move;toB=from+(toB-toA);toA=from;}else if(toB<from){let move=preferredPos<=from&&preferredPos>=toB?from-preferredPos:0;from-=move;toA=from+(toA-toB);toB=from;}return{from,toA,toB};}function selectionPoints(view){let result=[];if(view.root.activeElement!=view.contentDOM)return result;let{anchorNode,anchorOffset,focusNode,focusOffset}=view.observer.selectionRange;if(anchorNode){result.push(new DOMPoint(anchorNode,anchorOffset));if(focusNode!=anchorNode||focusOffset!=anchorOffset)result.push(new DOMPoint(focusNode,focusOffset));}return result;}function selectionFromPoints(points,base){if(points.length==0)return null;let anchor=points[0].pos,head=points.length==2?points[1].pos:anchor;return anchor>-1&&head>-1?EditorSelection.single(anchor+base,head+base):null;}const observeOptions={childList:true,characterData:true,subtree:true,attributes:true,characterDataOldValue:true};// IE11 has very broken mutation observers, so we also listen to
// DOMCharacterDataModified there
const useCharData=browser.ie&&browser.ie_version<=11;class DOMObserver{constructor(view){this.view=view;this.active=false;// The known selection. Kept in our own object, as opposed to just
// directly accessing the selection because:
//  - Safari doesn't report the right selection in shadow DOM
//  - Reading from the selection forces a DOM layout
//  - This way, we can ignore selectionchange events if we have
//    already seen the 'new' selection
this.selectionRange=new DOMSelectionState();// Set when a selection change is detected, cleared on flush
this.selectionChanged=false;this.delayedFlush=-1;this.resizeTimeout=-1;this.queue=[];this.delayedAndroidKey=null;this.flushingAndroidKey=-1;this.lastChange=0;this.scrollTargets=[];this.intersection=null;this.resizeScroll=null;this.intersecting=false;this.gapIntersection=null;this.gaps=[];// Timeout for scheduling check of the parents that need scroll handlers
this.parentCheck=-1;this.dom=view.contentDOM;this.observer=new MutationObserver(mutations=>{for(let mut of mutations)this.queue.push(mut);// IE11 will sometimes (on typing over a selection or
// backspacing out a single character text node) call the
// observer callback before actually updating the DOM.
//
// Unrelatedly, iOS Safari will, when ending a composition,
// sometimes first clear it, deliver the mutations, and then
// reinsert the finished text. CodeMirror's handling of the
// deletion will prevent the reinsertion from happening,
// breaking composition.
if((browser.ie&&browser.ie_version<=11||browser.ios&&view.composing)&&mutations.some(m=>m.type=="childList"&&m.removedNodes.length||m.type=="characterData"&&m.oldValue.length>m.target.nodeValue.length))this.flushSoon();else this.flush();});if(useCharData)this.onCharData=event=>{this.queue.push({target:event.target,type:"characterData",oldValue:event.prevValue});this.flushSoon();};this.onSelectionChange=this.onSelectionChange.bind(this);this.onResize=this.onResize.bind(this);this.onPrint=this.onPrint.bind(this);this.onScroll=this.onScroll.bind(this);if(typeof ResizeObserver=="function"){this.resizeScroll=new ResizeObserver(()=>{var _a;if(((_a=this.view.docView)===null||_a===void 0?void 0:_a.lastUpdate)<Date.now()-75)this.onResize();});this.resizeScroll.observe(view.scrollDOM);}this.addWindowListeners(this.win=view.win);this.start();if(typeof IntersectionObserver=="function"){this.intersection=new IntersectionObserver(entries=>{if(this.parentCheck<0)this.parentCheck=setTimeout(this.listenForScroll.bind(this),1000);if(entries.length>0&&entries[entries.length-1].intersectionRatio>0!=this.intersecting){this.intersecting=!this.intersecting;if(this.intersecting!=this.view.inView)this.onScrollChanged(document.createEvent("Event"));}},{threshold:[0,.001]});this.intersection.observe(this.dom);this.gapIntersection=new IntersectionObserver(entries=>{if(entries.length>0&&entries[entries.length-1].intersectionRatio>0)this.onScrollChanged(document.createEvent("Event"));},{});}this.listenForScroll();this.readSelectionRange();}onScrollChanged(e){this.view.inputState.runHandlers("scroll",e);if(this.intersecting)this.view.measure();}onScroll(e){if(this.intersecting)this.flush(false);this.onScrollChanged(e);}onResize(){if(this.resizeTimeout<0)this.resizeTimeout=setTimeout(()=>{this.resizeTimeout=-1;this.view.requestMeasure();},50);}onPrint(){this.view.viewState.printing=true;this.view.measure();setTimeout(()=>{this.view.viewState.printing=false;this.view.requestMeasure();},500);}updateGaps(gaps){if(this.gapIntersection&&(gaps.length!=this.gaps.length||this.gaps.some((g,i)=>g!=gaps[i]))){this.gapIntersection.disconnect();for(let gap of gaps)this.gapIntersection.observe(gap);this.gaps=gaps;}}onSelectionChange(event){let wasChanged=this.selectionChanged;if(!this.readSelectionRange()||this.delayedAndroidKey)return;let{view}=this,sel=this.selectionRange;if(view.state.facet(editable)?view.root.activeElement!=this.dom:!hasSelection(view.dom,sel))return;let context=sel.anchorNode&&view.docView.nearest(sel.anchorNode);if(context&&context.ignoreEvent(event)){if(!wasChanged)this.selectionChanged=false;return;}// Deletions on IE11 fire their events in the wrong order, giving
// us a selection change event before the DOM changes are
// reported.
// Chrome Android has a similar issue when backspacing out a
// selection (#645).
if((browser.ie&&browser.ie_version<=11||browser.android&&browser.chrome)&&!view.state.selection.main.empty&&// (Selection.isCollapsed isn't reliable on IE)
sel.focusNode&&isEquivalentPosition(sel.focusNode,sel.focusOffset,sel.anchorNode,sel.anchorOffset))this.flushSoon();else this.flush(false);}readSelectionRange(){let{view}=this;// The Selection object is broken in shadow roots in Safari. See
// https://github.com/codemirror/dev/issues/414
let range=browser.safari&&view.root.nodeType==11&&deepActiveElement(this.dom.ownerDocument)==this.dom&&safariSelectionRangeHack(this.view)||getSelection(view.root);if(!range||this.selectionRange.eq(range))return false;let local=hasSelection(this.dom,range);// Detect the situation where the browser has, on focus, moved the
// selection to the start of the content element. Reset it to the
// position from the editor state.
if(local&&!this.selectionChanged&&view.inputState.lastFocusTime>Date.now()-200&&view.inputState.lastTouchTime<Date.now()-300&&atElementStart(this.dom,range)){this.view.inputState.lastFocusTime=0;view.docView.updateSelection();return false;}this.selectionRange.setRange(range);if(local)this.selectionChanged=true;return true;}setSelectionRange(anchor,head){this.selectionRange.set(anchor.node,anchor.offset,head.node,head.offset);this.selectionChanged=false;}clearSelectionRange(){this.selectionRange.set(null,0,null,0);}listenForScroll(){this.parentCheck=-1;let i=0,changed=null;for(let dom=this.dom;dom;){if(dom.nodeType==1){if(!changed&&i<this.scrollTargets.length&&this.scrollTargets[i]==dom)i++;else if(!changed)changed=this.scrollTargets.slice(0,i);if(changed)changed.push(dom);dom=dom.assignedSlot||dom.parentNode;}else if(dom.nodeType==11){// Shadow root
dom=dom.host;}else{break;}}if(i<this.scrollTargets.length&&!changed)changed=this.scrollTargets.slice(0,i);if(changed){for(let dom of this.scrollTargets)dom.removeEventListener("scroll",this.onScroll);for(let dom of this.scrollTargets=changed)dom.addEventListener("scroll",this.onScroll);}}ignore(f){if(!this.active)return f();try{this.stop();return f();}finally{this.start();this.clear();}}start(){if(this.active)return;this.observer.observe(this.dom,observeOptions);if(useCharData)this.dom.addEventListener("DOMCharacterDataModified",this.onCharData);this.active=true;}stop(){if(!this.active)return;this.active=false;this.observer.disconnect();if(useCharData)this.dom.removeEventListener("DOMCharacterDataModified",this.onCharData);}// Throw away any pending changes
clear(){this.processRecords();this.queue.length=0;this.selectionChanged=false;}// Chrome Android, especially in combination with GBoard, not only
// doesn't reliably fire regular key events, but also often
// surrounds the effect of enter or backspace with a bunch of
// composition events that, when interrupted, cause text duplication
// or other kinds of corruption. This hack makes the editor back off
// from handling DOM changes for a moment when such a key is
// detected (via beforeinput or keydown), and then tries to flush
// them or, if that has no effect, dispatches the given key.
delayAndroidKey(key,keyCode){var _a;if(!this.delayedAndroidKey){let flush=()=>{let key=this.delayedAndroidKey;if(key){this.clearDelayedAndroidKey();this.view.inputState.lastKeyCode=key.keyCode;this.view.inputState.lastKeyTime=Date.now();let flushed=this.flush();if(!flushed&&key.force)dispatchKey(this.dom,key.key,key.keyCode);}};this.flushingAndroidKey=this.view.win.requestAnimationFrame(flush);}// Since backspace beforeinput is sometimes signalled spuriously,
// Enter always takes precedence.
if(!this.delayedAndroidKey||key=="Enter")this.delayedAndroidKey={key,keyCode,// Only run the key handler when no changes are detected if
// this isn't coming right after another change, in which case
// it is probably part of a weird chain of updates, and should
// be ignored if it returns the DOM to its previous state.
force:this.lastChange<Date.now()-50||!!((_a=this.delayedAndroidKey)===null||_a===void 0?void 0:_a.force)};}clearDelayedAndroidKey(){this.win.cancelAnimationFrame(this.flushingAndroidKey);this.delayedAndroidKey=null;this.flushingAndroidKey=-1;}flushSoon(){if(this.delayedFlush<0)this.delayedFlush=this.view.win.requestAnimationFrame(()=>{this.delayedFlush=-1;this.flush();});}forceFlush(){if(this.delayedFlush>=0){this.view.win.cancelAnimationFrame(this.delayedFlush);this.delayedFlush=-1;}this.flush();}pendingRecords(){for(let mut of this.observer.takeRecords())this.queue.push(mut);return this.queue;}processRecords(){let records=this.pendingRecords();if(records.length)this.queue=[];let from=-1,to=-1,typeOver=false;for(let record of records){let range=this.readMutation(record);if(!range)continue;if(range.typeOver)typeOver=true;if(from==-1){({from,to}=range);}else{from=Math.min(range.from,from);to=Math.max(range.to,to);}}return{from,to,typeOver};}readChange(){let{from,to,typeOver}=this.processRecords();let newSel=this.selectionChanged&&hasSelection(this.dom,this.selectionRange);if(from<0&&!newSel)return null;if(from>-1)this.lastChange=Date.now();this.view.inputState.lastFocusTime=0;this.selectionChanged=false;let change=new DOMChange(this.view,from,to,typeOver);this.view.docView.domChanged={newSel:change.newSel?change.newSel.main:null};return change;}// Apply pending changes, if any
flush(readSelection=true){// Completely hold off flushing when pending keys are set—the code
// managing those will make sure processRecords is called and the
// view is resynchronized after
if(this.delayedFlush>=0||this.delayedAndroidKey)return false;if(readSelection)this.readSelectionRange();let domChange=this.readChange();if(!domChange){this.view.requestMeasure();return false;}let startState=this.view.state;let handled=applyDOMChange(this.view,domChange);// The view wasn't updated
if(this.view.state==startState)this.view.update([]);return handled;}readMutation(rec){let cView=this.view.docView.nearest(rec.target);if(!cView||cView.ignoreMutation(rec))return null;cView.markDirty(rec.type=="attributes");if(rec.type=="attributes")cView.flags|=4/* ViewFlag.AttrsDirty */;if(rec.type=="childList"){let childBefore=findChild(cView,rec.previousSibling||rec.target.previousSibling,-1);let childAfter=findChild(cView,rec.nextSibling||rec.target.nextSibling,1);return{from:childBefore?cView.posAfter(childBefore):cView.posAtStart,to:childAfter?cView.posBefore(childAfter):cView.posAtEnd,typeOver:false};}else if(rec.type=="characterData"){return{from:cView.posAtStart,to:cView.posAtEnd,typeOver:rec.target.nodeValue==rec.oldValue};}else{return null;}}setWindow(win){if(win!=this.win){this.removeWindowListeners(this.win);this.win=win;this.addWindowListeners(this.win);}}addWindowListeners(win){win.addEventListener("resize",this.onResize);win.addEventListener("beforeprint",this.onPrint);win.addEventListener("scroll",this.onScroll);win.document.addEventListener("selectionchange",this.onSelectionChange);}removeWindowListeners(win){win.removeEventListener("scroll",this.onScroll);win.removeEventListener("resize",this.onResize);win.removeEventListener("beforeprint",this.onPrint);win.document.removeEventListener("selectionchange",this.onSelectionChange);}destroy(){var _a,_b,_c;this.stop();(_a=this.intersection)===null||_a===void 0?void 0:_a.disconnect();(_b=this.gapIntersection)===null||_b===void 0?void 0:_b.disconnect();(_c=this.resizeScroll)===null||_c===void 0?void 0:_c.disconnect();for(let dom of this.scrollTargets)dom.removeEventListener("scroll",this.onScroll);this.removeWindowListeners(this.win);clearTimeout(this.parentCheck);clearTimeout(this.resizeTimeout);this.win.cancelAnimationFrame(this.delayedFlush);this.win.cancelAnimationFrame(this.flushingAndroidKey);}}function findChild(cView,dom,dir){while(dom){let curView=ContentView.get(dom);if(curView&&curView.parent==cView)return curView;let parent=dom.parentNode;dom=parent!=cView.dom?parent:dir>0?dom.nextSibling:dom.previousSibling;}return null;}// Used to work around a Safari Selection/shadow DOM bug (#414)
function safariSelectionRangeHack(view){let found=null;// Because Safari (at least in 2018-2021) doesn't provide regular
// access to the selection inside a shadowroot, we have to perform a
// ridiculous hack to get at it—using `execCommand` to trigger a
// `beforeInput` event so that we can read the target range from the
// event.
function read(event){event.preventDefault();event.stopImmediatePropagation();found=event.getTargetRanges()[0];}view.contentDOM.addEventListener("beforeinput",read,true);view.dom.ownerDocument.execCommand("indent");view.contentDOM.removeEventListener("beforeinput",read,true);if(!found)return null;let anchorNode=found.startContainer,anchorOffset=found.startOffset;let focusNode=found.endContainer,focusOffset=found.endOffset;let curAnchor=view.docView.domAtPos(view.state.selection.main.anchor);// Since such a range doesn't distinguish between anchor and head,
// use a heuristic that flips it around if its end matches the
// current anchor.
if(isEquivalentPosition(curAnchor.node,curAnchor.offset,focusNode,focusOffset))[anchorNode,anchorOffset,focusNode,focusOffset]=[focusNode,focusOffset,anchorNode,anchorOffset];return{anchorNode,anchorOffset,focusNode,focusOffset};}// The editor's update state machine looks something like this:
//
//     Idle → Updating ⇆ Idle (unchecked) → Measuring → Idle
//                                         ↑      ↓
//                                         Updating (measure)
//
// The difference between 'Idle' and 'Idle (unchecked)' lies in
// whether a layout check has been scheduled. A regular update through
// the `update` method updates the DOM in a write-only fashion, and
// relies on a check (scheduled with `requestAnimationFrame`) to make
// sure everything is where it should be and the viewport covers the
// visible code. That check continues to measure and then optionally
// update until it reaches a coherent state.
/**
  An editor view represents the editor's user interface. It holds
  the editable DOM surface, and possibly other elements such as the
  line number gutter. It handles events and dispatches state
  transactions for editing actions.
  */class EditorView{/**
      The current editor state.
      */get state(){return this.viewState.state;}/**
      To be able to display large documents without consuming too much
      memory or overloading the browser, CodeMirror only draws the
      code that is visible (plus a margin around it) to the DOM. This
      property tells you the extent of the current drawn viewport, in
      document positions.
      */get viewport(){return this.viewState.viewport;}/**
      When there are, for example, large collapsed ranges in the
      viewport, its size can be a lot bigger than the actual visible
      content. Thus, if you are doing something like styling the
      content in the viewport, it is preferable to only do so for
      these ranges, which are the subset of the viewport that is
      actually drawn.
      */get visibleRanges(){return this.viewState.visibleRanges;}/**
      Returns false when the editor is entirely scrolled out of view
      or otherwise hidden.
      */get inView(){return this.viewState.inView;}/**
      Indicates whether the user is currently composing text via
      [IME](https://en.wikipedia.org/wiki/Input_method), and at least
      one change has been made in the current composition.
      */get composing(){return this.inputState.composing>0;}/**
      Indicates whether the user is currently in composing state. Note
      that on some platforms, like Android, this will be the case a
      lot, since just putting the cursor on a word starts a
      composition there.
      */get compositionStarted(){return this.inputState.composing>=0;}/**
      The document or shadow root that the view lives in.
      */get root(){return this._root;}/**
      @internal
      */get win(){return this.dom.ownerDocument.defaultView||window;}/**
      Construct a new view. You'll want to either provide a `parent`
      option, or put `view.dom` into your document after creating a
      view, so that the user can see the editor.
      */constructor(config={}){this.plugins=[];this.pluginMap=new Map();this.editorAttrs={};this.contentAttrs={};this.bidiCache=[];this.destroyed=false;/**
          @internal
          */this.updateState=2/* UpdateState.Updating */;/**
          @internal
          */this.measureScheduled=-1;/**
          @internal
          */this.measureRequests=[];this.contentDOM=document.createElement("div");this.scrollDOM=document.createElement("div");this.scrollDOM.tabIndex=-1;this.scrollDOM.className="cm-scroller";this.scrollDOM.appendChild(this.contentDOM);this.announceDOM=document.createElement("div");this.announceDOM.className="cm-announced";this.announceDOM.setAttribute("aria-live","polite");this.dom=document.createElement("div");this.dom.appendChild(this.announceDOM);this.dom.appendChild(this.scrollDOM);if(config.parent)config.parent.appendChild(this.dom);let{dispatch}=config;this.dispatchTransactions=config.dispatchTransactions||dispatch&&(trs=>trs.forEach(tr=>dispatch(tr,this)))||(trs=>this.update(trs));this.dispatch=this.dispatch.bind(this);this._root=config.root||getRoot(config.parent)||document;this.viewState=new ViewState(config.state||EditorState.create(config));if(config.scrollTo&&config.scrollTo.is(scrollIntoView$1))this.viewState.scrollTarget=config.scrollTo.value.clip(this.viewState.state);this.plugins=this.state.facet(viewPlugin).map(spec=>new PluginInstance(spec));for(let plugin of this.plugins)plugin.update(this);this.observer=new DOMObserver(this);this.inputState=new InputState(this);this.inputState.ensureHandlers(this.plugins);this.docView=new DocView(this);this.mountStyles();this.updateAttrs();this.updateState=0/* UpdateState.Idle */;this.requestMeasure();}dispatch(...input){let trs=input.length==1&&input[0]instanceof Transaction?input:input.length==1&&Array.isArray(input[0])?input[0]:[this.state.update(...input)];this.dispatchTransactions(trs,this);}/**
      Update the view for the given array of transactions. This will
      update the visible document and selection to match the state
      produced by the transactions, and notify view plugins of the
      change. You should usually call
      [`dispatch`](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) instead, which uses this
      as a primitive.
      */update(transactions){if(this.updateState!=0/* UpdateState.Idle */)throw new Error("Calls to EditorView.update are not allowed while an update is in progress");let redrawn=false,attrsChanged=false,update;let state=this.state;for(let tr of transactions){if(tr.startState!=state)throw new RangeError("Trying to update state with a transaction that doesn't start from the previous state.");state=tr.state;}if(this.destroyed){this.viewState.state=state;return;}let focus=this.hasFocus,focusFlag=0,dispatchFocus=null;if(transactions.some(tr=>tr.annotation(isFocusChange))){this.inputState.notifiedFocused=focus;// If a focus-change transaction is being dispatched, set this update flag.
focusFlag=1/* UpdateFlag.Focus */;}else if(focus!=this.inputState.notifiedFocused){this.inputState.notifiedFocused=focus;// Schedule a separate focus transaction if necessary, otherwise
// add a flag to this update
dispatchFocus=focusChangeTransaction(state,focus);if(!dispatchFocus)focusFlag=1/* UpdateFlag.Focus */;}// If there was a pending DOM change, eagerly read it and try to
// apply it after the given transactions.
let pendingKey=this.observer.delayedAndroidKey,domChange=null;if(pendingKey){this.observer.clearDelayedAndroidKey();domChange=this.observer.readChange();// Only try to apply DOM changes if the transactions didn't
// change the doc or selection.
if(domChange&&!this.state.doc.eq(state.doc)||!this.state.selection.eq(state.selection))domChange=null;}else{this.observer.clear();}// When the phrases change, redraw the editor
if(state.facet(EditorState.phrases)!=this.state.facet(EditorState.phrases))return this.setState(state);update=ViewUpdate.create(this,state,transactions);update.flags|=focusFlag;let scrollTarget=this.viewState.scrollTarget;try{this.updateState=2/* UpdateState.Updating */;for(let tr of transactions){if(scrollTarget)scrollTarget=scrollTarget.map(tr.changes);if(tr.scrollIntoView){let{main}=tr.state.selection;scrollTarget=new ScrollTarget(main.empty?main:EditorSelection.cursor(main.head,main.head>main.anchor?-1:1));}for(let e of tr.effects)if(e.is(scrollIntoView$1))scrollTarget=e.value.clip(this.state);}this.viewState.update(update,scrollTarget);this.bidiCache=CachedOrder.update(this.bidiCache,update.changes);if(!update.empty){this.updatePlugins(update);this.inputState.update(update);}redrawn=this.docView.update(update);if(this.state.facet(styleModule)!=this.styleModules)this.mountStyles();attrsChanged=this.updateAttrs();this.showAnnouncements(transactions);this.docView.updateSelection(redrawn,transactions.some(tr=>tr.isUserEvent("select.pointer")));}finally{this.updateState=0/* UpdateState.Idle */;}if(update.startState.facet(theme)!=update.state.facet(theme))this.viewState.mustMeasureContent=true;if(redrawn||attrsChanged||scrollTarget||this.viewState.mustEnforceCursorAssoc||this.viewState.mustMeasureContent)this.requestMeasure();if(redrawn)this.docViewUpdate();if(!update.empty)for(let listener of this.state.facet(updateListener)){try{listener(update);}catch(e){logException(this.state,e,"update listener");}}if(dispatchFocus||domChange)Promise.resolve().then(()=>{if(dispatchFocus&&this.state==dispatchFocus.startState)this.dispatch(dispatchFocus);if(domChange){if(!applyDOMChange(this,domChange)&&pendingKey.force)dispatchKey(this.contentDOM,pendingKey.key,pendingKey.keyCode);}});}/**
      Reset the view to the given state. (This will cause the entire
      document to be redrawn and all view plugins to be reinitialized,
      so you should probably only use it when the new state isn't
      derived from the old state. Otherwise, use
      [`dispatch`](https://codemirror.net/6/docs/ref/#view.EditorView.dispatch) instead.)
      */setState(newState){if(this.updateState!=0/* UpdateState.Idle */)throw new Error("Calls to EditorView.setState are not allowed while an update is in progress");if(this.destroyed){this.viewState.state=newState;return;}this.updateState=2/* UpdateState.Updating */;let hadFocus=this.hasFocus;try{for(let plugin of this.plugins)plugin.destroy(this);this.viewState=new ViewState(newState);this.plugins=newState.facet(viewPlugin).map(spec=>new PluginInstance(spec));this.pluginMap.clear();for(let plugin of this.plugins)plugin.update(this);this.docView.destroy();this.docView=new DocView(this);this.inputState.ensureHandlers(this.plugins);this.mountStyles();this.updateAttrs();this.bidiCache=[];}finally{this.updateState=0/* UpdateState.Idle */;}if(hadFocus)this.focus();this.requestMeasure();}updatePlugins(update){let prevSpecs=update.startState.facet(viewPlugin),specs=update.state.facet(viewPlugin);if(prevSpecs!=specs){let newPlugins=[];for(let spec of specs){let found=prevSpecs.indexOf(spec);if(found<0){newPlugins.push(new PluginInstance(spec));}else{let plugin=this.plugins[found];plugin.mustUpdate=update;newPlugins.push(plugin);}}for(let plugin of this.plugins)if(plugin.mustUpdate!=update)plugin.destroy(this);this.plugins=newPlugins;this.pluginMap.clear();}else{for(let p of this.plugins)p.mustUpdate=update;}for(let i=0;i<this.plugins.length;i++)this.plugins[i].update(this);if(prevSpecs!=specs)this.inputState.ensureHandlers(this.plugins);}docViewUpdate(){for(let plugin of this.plugins){let val=plugin.value;if(val&&val.docViewUpdate){try{val.docViewUpdate(this);}catch(e){logException(this.state,e,"doc view update listener");}}}}/**
      @internal
      */measure(flush=true){if(this.destroyed)return;if(this.measureScheduled>-1)this.win.cancelAnimationFrame(this.measureScheduled);if(this.observer.delayedAndroidKey){this.measureScheduled=-1;this.requestMeasure();return;}this.measureScheduled=0;// Prevent requestMeasure calls from scheduling another animation frame
if(flush)this.observer.forceFlush();let updated=null;let sDOM=this.scrollDOM,scrollTop=sDOM.scrollTop*this.scaleY;let{scrollAnchorPos,scrollAnchorHeight}=this.viewState;if(Math.abs(scrollTop-this.viewState.scrollTop)>1)scrollAnchorHeight=-1;this.viewState.scrollAnchorHeight=-1;try{for(let i=0;;i++){if(scrollAnchorHeight<0){if(isScrolledToBottom(sDOM)){scrollAnchorPos=-1;scrollAnchorHeight=this.viewState.heightMap.height;}else{let block=this.viewState.scrollAnchorAt(scrollTop);scrollAnchorPos=block.from;scrollAnchorHeight=block.top;}}this.updateState=1/* UpdateState.Measuring */;let changed=this.viewState.measure(this);if(!changed&&!this.measureRequests.length&&this.viewState.scrollTarget==null)break;if(i>5){void 0;break;}let measuring=[];// Only run measure requests in this cycle when the viewport didn't change
if(!(changed&4/* UpdateFlag.Viewport */))[this.measureRequests,measuring]=[measuring,this.measureRequests];let measured=measuring.map(m=>{try{return m.read(this);}catch(e){logException(this.state,e);return BadMeasure;}});let update=ViewUpdate.create(this,this.state,[]),redrawn=false;update.flags|=changed;if(!updated)updated=update;else updated.flags|=changed;this.updateState=2/* UpdateState.Updating */;if(!update.empty){this.updatePlugins(update);this.inputState.update(update);this.updateAttrs();redrawn=this.docView.update(update);if(redrawn)this.docViewUpdate();}for(let i=0;i<measuring.length;i++)if(measured[i]!=BadMeasure){try{let m=measuring[i];if(m.write)m.write(measured[i],this);}catch(e){logException(this.state,e);}}if(redrawn)this.docView.updateSelection(true);if(!update.viewportChanged&&this.measureRequests.length==0){if(this.viewState.editorHeight){if(this.viewState.scrollTarget){this.docView.scrollIntoView(this.viewState.scrollTarget);this.viewState.scrollTarget=null;scrollAnchorHeight=-1;continue;}else{let newAnchorHeight=scrollAnchorPos<0?this.viewState.heightMap.height:this.viewState.lineBlockAt(scrollAnchorPos).top;let diff=newAnchorHeight-scrollAnchorHeight;if(diff>1||diff<-1){scrollTop=scrollTop+diff;sDOM.scrollTop=scrollTop/this.scaleY;scrollAnchorHeight=-1;continue;}}}break;}}}finally{this.updateState=0/* UpdateState.Idle */;this.measureScheduled=-1;}if(updated&&!updated.empty)for(let listener of this.state.facet(updateListener))listener(updated);}/**
      Get the CSS classes for the currently active editor themes.
      */get themeClasses(){return baseThemeID+" "+(this.state.facet(darkTheme)?baseDarkID:baseLightID)+" "+this.state.facet(theme);}updateAttrs(){let editorAttrs=attrsFromFacet(this,editorAttributes,{class:"cm-editor"+(this.hasFocus?" cm-focused ":" ")+this.themeClasses});let contentAttrs={spellcheck:"false",autocorrect:"off",autocapitalize:"off",translate:"no",contenteditable:!this.state.facet(editable)?"false":"true",class:"cm-content",style:`${browser.tabSize}: ${this.state.tabSize}`,role:"textbox","aria-multiline":"true"};if(this.state.readOnly)contentAttrs["aria-readonly"]="true";attrsFromFacet(this,contentAttributes,contentAttrs);let changed=this.observer.ignore(()=>{let changedContent=updateAttrs(this.contentDOM,this.contentAttrs,contentAttrs);let changedEditor=updateAttrs(this.dom,this.editorAttrs,editorAttrs);return changedContent||changedEditor;});this.editorAttrs=editorAttrs;this.contentAttrs=contentAttrs;return changed;}showAnnouncements(trs){let first=true;for(let tr of trs)for(let effect of tr.effects)if(effect.is(EditorView.announce)){if(first)this.announceDOM.textContent="";first=false;let div=this.announceDOM.appendChild(document.createElement("div"));div.textContent=effect.value;}}mountStyles(){this.styleModules=this.state.facet(styleModule);let nonce=this.state.facet(EditorView.cspNonce);StyleModule.mount(this.root,this.styleModules.concat(baseTheme$1$3).reverse(),nonce?{nonce}:undefined);}readMeasured(){if(this.updateState==2/* UpdateState.Updating */)throw new Error("Reading the editor layout isn't allowed during an update");if(this.updateState==0/* UpdateState.Idle */&&this.measureScheduled>-1)this.measure(false);}/**
      Schedule a layout measurement, optionally providing callbacks to
      do custom DOM measuring followed by a DOM write phase. Using
      this is preferable reading DOM layout directly from, for
      example, an event handler, because it'll make sure measuring and
      drawing done by other components is synchronized, avoiding
      unnecessary DOM layout computations.
      */requestMeasure(request){if(this.measureScheduled<0)this.measureScheduled=this.win.requestAnimationFrame(()=>this.measure());if(request){if(this.measureRequests.indexOf(request)>-1)return;if(request.key!=null)for(let i=0;i<this.measureRequests.length;i++){if(this.measureRequests[i].key===request.key){this.measureRequests[i]=request;return;}}this.measureRequests.push(request);}}/**
      Get the value of a specific plugin, if present. Note that
      plugins that crash can be dropped from a view, so even when you
      know you registered a given plugin, it is recommended to check
      the return value of this method.
      */plugin(plugin){let known=this.pluginMap.get(plugin);if(known===undefined||known&&known.spec!=plugin)this.pluginMap.set(plugin,known=this.plugins.find(p=>p.spec==plugin)||null);return known&&known.update(this).value;}/**
      The top position of the document, in screen coordinates. This
      may be negative when the editor is scrolled down. Points
      directly to the top of the first line, not above the padding.
      */get documentTop(){return this.contentDOM.getBoundingClientRect().top+this.viewState.paddingTop;}/**
      Reports the padding above and below the document.
      */get documentPadding(){return{top:this.viewState.paddingTop,bottom:this.viewState.paddingBottom};}/**
      If the editor is transformed with CSS, this provides the scale
      along the X axis. Otherwise, it will just be 1. Note that
      transforms other than translation and scaling are not supported.
      */get scaleX(){return this.viewState.scaleX;}/**
      Provide the CSS transformed scale along the Y axis.
      */get scaleY(){return this.viewState.scaleY;}/**
      Find the text line or block widget at the given vertical
      position (which is interpreted as relative to the [top of the
      document](https://codemirror.net/6/docs/ref/#view.EditorView.documentTop)).
      */elementAtHeight(height){this.readMeasured();return this.viewState.elementAtHeight(height);}/**
      Find the line block (see
      [`lineBlockAt`](https://codemirror.net/6/docs/ref/#view.EditorView.lineBlockAt) at the given
      height, again interpreted relative to the [top of the
      document](https://codemirror.net/6/docs/ref/#view.EditorView.documentTop).
      */lineBlockAtHeight(height){this.readMeasured();return this.viewState.lineBlockAtHeight(height);}/**
      Get the extent and vertical position of all [line
      blocks](https://codemirror.net/6/docs/ref/#view.EditorView.lineBlockAt) in the viewport. Positions
      are relative to the [top of the
      document](https://codemirror.net/6/docs/ref/#view.EditorView.documentTop);
      */get viewportLineBlocks(){return this.viewState.viewportLines;}/**
      Find the line block around the given document position. A line
      block is a range delimited on both sides by either a
      non-[hidden](https://codemirror.net/6/docs/ref/#view.Decoration^replace) line breaks, or the
      start/end of the document. It will usually just hold a line of
      text, but may be broken into multiple textblocks by block
      widgets.
      */lineBlockAt(pos){return this.viewState.lineBlockAt(pos);}/**
      The editor's total content height.
      */get contentHeight(){return this.viewState.contentHeight;}/**
      Move a cursor position by [grapheme
      cluster](https://codemirror.net/6/docs/ref/#state.findClusterBreak). `forward` determines whether
      the motion is away from the line start, or towards it. In
      bidirectional text, the line is traversed in visual order, using
      the editor's [text direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection).
      When the start position was the last one on the line, the
      returned position will be across the line break. If there is no
      further line, the original position is returned.
      
      By default, this method moves over a single cluster. The
      optional `by` argument can be used to move across more. It will
      be called with the first cluster as argument, and should return
      a predicate that determines, for each subsequent cluster,
      whether it should also be moved over.
      */moveByChar(start,forward,by){return skipAtoms(this,start,moveByChar(this,start,forward,by));}/**
      Move a cursor position across the next group of either
      [letters](https://codemirror.net/6/docs/ref/#state.EditorState.charCategorizer) or non-letter
      non-whitespace characters.
      */moveByGroup(start,forward){return skipAtoms(this,start,moveByChar(this,start,forward,initial=>byGroup(this,start.head,initial)));}/**
      Get the cursor position visually at the start or end of a line.
      Note that this may differ from the _logical_ position at its
      start or end (which is simply at `line.from`/`line.to`) if text
      at the start or end goes against the line's base text direction.
      */visualLineSide(line,end){let order=this.bidiSpans(line),dir=this.textDirectionAt(line.from);let span=order[end?order.length-1:0];return EditorSelection.cursor(span.side(end,dir)+line.from,span.forward(!end,dir)?1:-1);}/**
      Move to the next line boundary in the given direction. If
      `includeWrap` is true, line wrapping is on, and there is a
      further wrap point on the current line, the wrap point will be
      returned. Otherwise this function will return the start or end
      of the line.
      */moveToLineBoundary(start,forward,includeWrap=true){return moveToLineBoundary(this,start,forward,includeWrap);}/**
      Move a cursor position vertically. When `distance` isn't given,
      it defaults to moving to the next line (including wrapped
      lines). Otherwise, `distance` should provide a positive distance
      in pixels.
      
      When `start` has a
      [`goalColumn`](https://codemirror.net/6/docs/ref/#state.SelectionRange.goalColumn), the vertical
      motion will use that as a target horizontal position. Otherwise,
      the cursor's own horizontal position is used. The returned
      cursor will have its goal column set to whichever column was
      used.
      */moveVertically(start,forward,distance){return skipAtoms(this,start,moveVertically(this,start,forward,distance));}/**
      Find the DOM parent node and offset (child offset if `node` is
      an element, character offset when it is a text node) at the
      given document position.
      
      Note that for positions that aren't currently in
      `visibleRanges`, the resulting DOM position isn't necessarily
      meaningful (it may just point before or after a placeholder
      element).
      */domAtPos(pos){return this.docView.domAtPos(pos);}/**
      Find the document position at the given DOM node. Can be useful
      for associating positions with DOM events. Will raise an error
      when `node` isn't part of the editor content.
      */posAtDOM(node,offset=0){return this.docView.posFromDOM(node,offset);}posAtCoords(coords,precise=true){this.readMeasured();return posAtCoords(this,coords,precise);}/**
      Get the screen coordinates at the given document position.
      `side` determines whether the coordinates are based on the
      element before (-1) or after (1) the position (if no element is
      available on the given side, the method will transparently use
      another strategy to get reasonable coordinates).
      */coordsAtPos(pos,side=1){this.readMeasured();let rect=this.docView.coordsAt(pos,side);if(!rect||rect.left==rect.right)return rect;let line=this.state.doc.lineAt(pos),order=this.bidiSpans(line);let span=order[BidiSpan.find(order,pos-line.from,-1,side)];return flattenRect(rect,span.dir==Direction.LTR==side>0);}/**
      Return the rectangle around a given character. If `pos` does not
      point in front of a character that is in the viewport and
      rendered (i.e. not replaced, not a line break), this will return
      null. For space characters that are a line wrap point, this will
      return the position before the line break.
      */coordsForChar(pos){this.readMeasured();return this.docView.coordsForChar(pos);}/**
      The default width of a character in the editor. May not
      accurately reflect the width of all characters (given variable
      width fonts or styling of invididual ranges).
      */get defaultCharacterWidth(){return this.viewState.heightOracle.charWidth;}/**
      The default height of a line in the editor. May not be accurate
      for all lines.
      */get defaultLineHeight(){return this.viewState.heightOracle.lineHeight;}/**
      The text direction
      ([`direction`](https://developer.mozilla.org/en-US/docs/Web/CSS/direction)
      CSS property) of the editor's content element.
      */get textDirection(){return this.viewState.defaultTextDirection;}/**
      Find the text direction of the block at the given position, as
      assigned by CSS. If
      [`perLineTextDirection`](https://codemirror.net/6/docs/ref/#view.EditorView^perLineTextDirection)
      isn't enabled, or the given position is outside of the viewport,
      this will always return the same as
      [`textDirection`](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection). Note that
      this may trigger a DOM layout.
      */textDirectionAt(pos){let perLine=this.state.facet(perLineTextDirection);if(!perLine||pos<this.viewport.from||pos>this.viewport.to)return this.textDirection;this.readMeasured();return this.docView.textDirectionAt(pos);}/**
      Whether this editor [wraps lines](https://codemirror.net/6/docs/ref/#view.EditorView.lineWrapping)
      (as determined by the
      [`white-space`](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space)
      CSS property of its content element).
      */get lineWrapping(){return this.viewState.heightOracle.lineWrapping;}/**
      Returns the bidirectional text structure of the given line
      (which should be in the current document) as an array of span
      objects. The order of these spans matches the [text
      direction](https://codemirror.net/6/docs/ref/#view.EditorView.textDirection)—if that is
      left-to-right, the leftmost spans come first, otherwise the
      rightmost spans come first.
      */bidiSpans(line){if(line.length>MaxBidiLine)return trivialOrder(line.length);let dir=this.textDirectionAt(line.from),isolates;for(let entry of this.bidiCache){if(entry.from==line.from&&entry.dir==dir&&(entry.fresh||isolatesEq(entry.isolates,isolates=getIsolatedRanges(this,line))))return entry.order;}if(!isolates)isolates=getIsolatedRanges(this,line);let order=computeOrder(line.text,dir,isolates);this.bidiCache.push(new CachedOrder(line.from,line.to,dir,isolates,true,order));return order;}/**
      Check whether the editor has focus.
      */get hasFocus(){var _a;// Safari return false for hasFocus when the context menu is open
// or closing, which leads us to ignore selection changes from the
// context menu because it looks like the editor isn't focused.
// This kludges around that.
return(this.dom.ownerDocument.hasFocus()||browser.safari&&((_a=this.inputState)===null||_a===void 0?void 0:_a.lastContextMenu)>Date.now()-3e4)&&this.root.activeElement==this.contentDOM;}/**
      Put focus on the editor.
      */focus(){this.observer.ignore(()=>{focusPreventScroll(this.contentDOM);this.docView.updateSelection();});}/**
      Update the [root](https://codemirror.net/6/docs/ref/##view.EditorViewConfig.root) in which the editor lives. This is only
      necessary when moving the editor's existing DOM to a new window or shadow root.
      */setRoot(root){if(this._root!=root){this._root=root;this.observer.setWindow((root.nodeType==9?root:root.ownerDocument).defaultView||window);this.mountStyles();}}/**
      Clean up this editor view, removing its element from the
      document, unregistering event handlers, and notifying
      plugins. The view instance can no longer be used after
      calling this.
      */destroy(){for(let plugin of this.plugins)plugin.destroy(this);this.plugins=[];this.inputState.destroy();this.docView.destroy();this.dom.remove();this.observer.destroy();if(this.measureScheduled>-1)this.win.cancelAnimationFrame(this.measureScheduled);this.destroyed=true;}/**
      Returns an effect that can be
      [added](https://codemirror.net/6/docs/ref/#state.TransactionSpec.effects) to a transaction to
      cause it to scroll the given position or range into view.
      */static scrollIntoView(pos,options={}){return scrollIntoView$1.of(new ScrollTarget(typeof pos=="number"?EditorSelection.cursor(pos):pos,options.y,options.x,options.yMargin,options.xMargin));}/**
      Return an effect that resets the editor to its current (at the
      time this method was called) scroll position. Note that this
      only affects the editor's own scrollable element, not parents.
      See also
      [`EditorViewConfig.scrollTo`](https://codemirror.net/6/docs/ref/#view.EditorViewConfig.scrollTo).
      
      The effect should be used with a document identical to the one
      it was created for. Failing to do so is not an error, but may
      not scroll to the expected position. You can
      [map](https://codemirror.net/6/docs/ref/#state.StateEffect.map) the effect to account for changes.
      */scrollSnapshot(){let{scrollTop,scrollLeft}=this.scrollDOM;let ref=this.viewState.scrollAnchorAt(scrollTop);return scrollIntoView$1.of(new ScrollTarget(EditorSelection.cursor(ref.from),"start","start",ref.top-scrollTop,scrollLeft,true));}/**
      Returns an extension that can be used to add DOM event handlers.
      The value should be an object mapping event names to handler
      functions. For any given event, such functions are ordered by
      extension precedence, and the first handler to return true will
      be assumed to have handled that event, and no other handlers or
      built-in behavior will be activated for it. These are registered
      on the [content element](https://codemirror.net/6/docs/ref/#view.EditorView.contentDOM), except
      for `scroll` handlers, which will be called any time the
      editor's [scroll element](https://codemirror.net/6/docs/ref/#view.EditorView.scrollDOM) or one of
      its parent nodes is scrolled.
      */static domEventHandlers(handlers){return ViewPlugin.define(()=>({}),{eventHandlers:handlers});}/**
      Create an extension that registers DOM event observers. Contrary
      to event [handlers](https://codemirror.net/6/docs/ref/#view.EditorView^domEventHandlers),
      observers can't be prevented from running by a higher-precedence
      handler returning true. They also don't prevent other handlers
      and observers from running when they return true, and should not
      call `preventDefault`.
      */static domEventObservers(observers){return ViewPlugin.define(()=>({}),{eventObservers:observers});}/**
      Create a theme extension. The first argument can be a
      [`style-mod`](https://github.com/marijnh/style-mod#documentation)
      style spec providing the styles for the theme. These will be
      prefixed with a generated class for the style.
      
      Because the selectors will be prefixed with a scope class, rule
      that directly match the editor's [wrapper
      element](https://codemirror.net/6/docs/ref/#view.EditorView.dom)—to which the scope class will be
      added—need to be explicitly differentiated by adding an `&` to
      the selector for that element—for example
      `&.cm-focused`.
      
      When `dark` is set to true, the theme will be marked as dark,
      which will cause the `&dark` rules from [base
      themes](https://codemirror.net/6/docs/ref/#view.EditorView^baseTheme) to be used (as opposed to
      `&light` when a light theme is active).
      */static theme(spec,options){let prefix=StyleModule.newName();let result=[theme.of(prefix),styleModule.of(buildTheme(`.${prefix}`,spec))];if(options&&options.dark)result.push(darkTheme.of(true));return result;}/**
      Create an extension that adds styles to the base theme. Like
      with [`theme`](https://codemirror.net/6/docs/ref/#view.EditorView^theme), use `&` to indicate the
      place of the editor wrapper element when directly targeting
      that. You can also use `&dark` or `&light` instead to only
      target editors with a dark or light theme.
      */static baseTheme(spec){return Prec.lowest(styleModule.of(buildTheme("."+baseThemeID,spec,lightDarkIDs)));}/**
      Retrieve an editor view instance from the view's DOM
      representation.
      */static findFromDOM(dom){var _a;let content=dom.querySelector(".cm-content");let cView=content&&ContentView.get(content)||ContentView.get(dom);return((_a=cView===null||cView===void 0?void 0:cView.rootView)===null||_a===void 0?void 0:_a.view)||null;}}/**
  Facet to add a [style
  module](https://github.com/marijnh/style-mod#documentation) to
  an editor view. The view will ensure that the module is
  mounted in its [document
  root](https://codemirror.net/6/docs/ref/#view.EditorView.constructor^config.root).
  */EditorView.styleModule=styleModule;/**
  An input handler can override the way changes to the editable
  DOM content are handled. Handlers are passed the document
  positions between which the change was found, and the new
  content. When one returns true, no further input handlers are
  called and the default behavior is prevented.

  The `insert` argument can be used to get the default transaction
  that would be applied for this input. This can be useful when
  dispatching the custom behavior as a separate transaction.
  */EditorView.inputHandler=inputHandler$1;/**
  This facet can be used to provide functions that create effects
  to be dispatched when the editor's focus state changes.
  */EditorView.focusChangeEffect=focusChangeEffect;/**
  By default, the editor assumes all its content has the same
  [text direction](https://codemirror.net/6/docs/ref/#view.Direction). Configure this with a `true`
  value to make it read the text direction of every (rendered)
  line separately.
  */EditorView.perLineTextDirection=perLineTextDirection;/**
  Allows you to provide a function that should be called when the
  library catches an exception from an extension (mostly from view
  plugins, but may be used by other extensions to route exceptions
  from user-code-provided callbacks). This is mostly useful for
  debugging and logging. See [`logException`](https://codemirror.net/6/docs/ref/#view.logException).
  */EditorView.exceptionSink=exceptionSink;/**
  A facet that can be used to register a function to be called
  every time the view updates.
  */EditorView.updateListener=updateListener;/**
  Facet that controls whether the editor content DOM is editable.
  When its highest-precedence value is `false`, the element will
  not have its `contenteditable` attribute set. (Note that this
  doesn't affect API calls that change the editor content, even
  when those are bound to keys or buttons. See the
  [`readOnly`](https://codemirror.net/6/docs/ref/#state.EditorState.readOnly) facet for that.)
  */EditorView.editable=editable;/**
  Allows you to influence the way mouse selection happens. The
  functions in this facet will be called for a `mousedown` event
  on the editor, and can return an object that overrides the way a
  selection is computed from that mouse click or drag.
  */EditorView.mouseSelectionStyle=mouseSelectionStyle;/**
  Facet used to configure whether a given selection drag event
  should move or copy the selection. The given predicate will be
  called with the `mousedown` event, and can return `true` when
  the drag should move the content.
  */EditorView.dragMovesSelection=dragMovesSelection$1;/**
  Facet used to configure whether a given selecting click adds a
  new range to the existing selection or replaces it entirely. The
  default behavior is to check `event.metaKey` on macOS, and
  `event.ctrlKey` elsewhere.
  */EditorView.clickAddsSelectionRange=clickAddsSelectionRange;/**
  A facet that determines which [decorations](https://codemirror.net/6/docs/ref/#view.Decoration)
  are shown in the view. Decorations can be provided in two
  ways—directly, or via a function that takes an editor view.

  Only decoration sets provided directly are allowed to influence
  the editor's vertical layout structure. The ones provided as
  functions are called _after_ the new viewport has been computed,
  and thus **must not** introduce block widgets or replacing
  decorations that cover line breaks.

  If you want decorated ranges to behave like atomic units for
  cursor motion and deletion purposes, also provide the range set
  containing the decorations to
  [`EditorView.atomicRanges`](https://codemirror.net/6/docs/ref/#view.EditorView^atomicRanges).
  */EditorView.decorations=decorations;/**
  Facet that works much like
  [`decorations`](https://codemirror.net/6/docs/ref/#view.EditorView^decorations), but puts its
  inputs at the very bottom of the precedence stack, meaning mark
  decorations provided here will only be split by other, partially
  overlapping \`outerDecorations\` ranges, and wrap around all
  regular decorations. Use this for mark elements that should, as
  much as possible, remain in one piece.
  */EditorView.outerDecorations=outerDecorations;/**
  Used to provide ranges that should be treated as atoms as far as
  cursor motion is concerned. This causes methods like
  [`moveByChar`](https://codemirror.net/6/docs/ref/#view.EditorView.moveByChar) and
  [`moveVertically`](https://codemirror.net/6/docs/ref/#view.EditorView.moveVertically) (and the
  commands built on top of them) to skip across such regions when
  a selection endpoint would enter them. This does _not_ prevent
  direct programmatic [selection
  updates](https://codemirror.net/6/docs/ref/#state.TransactionSpec.selection) from moving into such
  regions.
  */EditorView.atomicRanges=atomicRanges;/**
  When range decorations add a `unicode-bidi: isolate` style, they
  should also include a
  [`bidiIsolate`](https://codemirror.net/6/docs/ref/#view.MarkDecorationSpec.bidiIsolate) property
  in their decoration spec, and be exposed through this facet, so
  that the editor can compute the proper text order. (Other values
  for `unicode-bidi`, except of course `normal`, are not
  supported.)
  */EditorView.bidiIsolatedRanges=bidiIsolatedRanges;/**
  Facet that allows extensions to provide additional scroll
  margins (space around the sides of the scrolling element that
  should be considered invisible). This can be useful when the
  plugin introduces elements that cover part of that element (for
  example a horizontally fixed gutter).
  */EditorView.scrollMargins=scrollMargins;/**
  This facet records whether a dark theme is active. The extension
  returned by [`theme`](https://codemirror.net/6/docs/ref/#view.EditorView^theme) automatically
  includes an instance of this when the `dark` option is set to
  true.
  */EditorView.darkTheme=darkTheme;/**
  Provides a Content Security Policy nonce to use when creating
  the style sheets for the editor. Holds the empty string when no
  nonce has been provided.
  */EditorView.cspNonce=/*@__PURE__*/Facet.define({combine:values=>values.length?values[0]:""});/**
  Facet that provides additional DOM attributes for the editor's
  editable DOM element.
  */EditorView.contentAttributes=contentAttributes;/**
  Facet that provides DOM attributes for the editor's outer
  element.
  */EditorView.editorAttributes=editorAttributes;/**
  An extension that enables line wrapping in the editor (by
  setting CSS `white-space` to `pre-wrap` in the content).
  */EditorView.lineWrapping=/*@__PURE__*/EditorView.contentAttributes.of({"class":"cm-lineWrapping"});/**
  State effect used to include screen reader announcements in a
  transaction. These will be added to the DOM in a visually hidden
  element with `aria-live="polite"` set, and should be used to
  describe effects that are visually obvious but may not be
  noticed by screen reader users (such as moving to the next
  search match).
  */EditorView.announce=/*@__PURE__*/StateEffect.define();// Maximum line length for which we compute accurate bidi info
const MaxBidiLine=4096;const BadMeasure={};class CachedOrder{constructor(from,to,dir,isolates,fresh,order){this.from=from;this.to=to;this.dir=dir;this.isolates=isolates;this.fresh=fresh;this.order=order;}static update(cache,changes){if(changes.empty&&!cache.some(c=>c.fresh))return cache;let result=[],lastDir=cache.length?cache[cache.length-1].dir:Direction.LTR;for(let i=Math.max(0,cache.length-10);i<cache.length;i++){let entry=cache[i];if(entry.dir==lastDir&&!changes.touchesRange(entry.from,entry.to))result.push(new CachedOrder(changes.mapPos(entry.from,1),changes.mapPos(entry.to,-1),entry.dir,entry.isolates,false,entry.order));}return result;}}function attrsFromFacet(view,facet,base){for(let sources=view.state.facet(facet),i=sources.length-1;i>=0;i--){let source=sources[i],value=typeof source=="function"?source(view):source;if(value)combineAttrs(value,base);}return base;}const currentPlatform=browser.mac?"mac":browser.windows?"win":browser.linux?"linux":"key";function normalizeKeyName(name,platform){const parts=name.split(/-(?!$)/);let result=parts[parts.length-1];if(result=="Space")result=" ";let alt,ctrl,shift,meta;for(let i=0;i<parts.length-1;++i){const mod=parts[i];if(/^(cmd|meta|m)$/i.test(mod))meta=true;else if(/^a(lt)?$/i.test(mod))alt=true;else if(/^(c|ctrl|control)$/i.test(mod))ctrl=true;else if(/^s(hift)?$/i.test(mod))shift=true;else if(/^mod$/i.test(mod)){if(platform=="mac")meta=true;else ctrl=true;}else throw new Error("Unrecognized modifier name: "+mod);}if(alt)result="Alt-"+result;if(ctrl)result="Ctrl-"+result;if(meta)result="Meta-"+result;if(shift)result="Shift-"+result;return result;}function modifiers(name,event,shift){if(event.altKey)name="Alt-"+name;if(event.ctrlKey)name="Ctrl-"+name;if(event.metaKey)name="Meta-"+name;if(shift!==false&&event.shiftKey)name="Shift-"+name;return name;}const handleKeyEvents=/*@__PURE__*/Prec.default(/*@__PURE__*/EditorView.domEventHandlers({keydown(event,view){return runHandlers(getKeymap(view.state),event,view,"editor");}}));/**
  Facet used for registering keymaps.

  You can add multiple keymaps to an editor. Their priorities
  determine their precedence (the ones specified early or with high
  priority get checked first). When a handler has returned `true`
  for a given key, no further handlers are called.
  */const keymap=/*@__PURE__*/Facet.define({enables:handleKeyEvents});const Keymaps=/*@__PURE__*/new WeakMap();// This is hidden behind an indirection, rather than directly computed
// by the facet, to keep internal types out of the facet's type.
function getKeymap(state){let bindings=state.facet(keymap);let map=Keymaps.get(bindings);if(!map)Keymaps.set(bindings,map=buildKeymap(bindings.reduce((a,b)=>a.concat(b),[])));return map;}/**
  Run the key handlers registered for a given scope. The event
  object should be a `"keydown"` event. Returns true if any of the
  handlers handled it.
  */function runScopeHandlers(view,event,scope){return runHandlers(getKeymap(view.state),event,view,scope);}let storedPrefix=null;const PrefixTimeout=4000;function buildKeymap(bindings,platform=currentPlatform){let bound=Object.create(null);let isPrefix=Object.create(null);let checkPrefix=(name,is)=>{let current=isPrefix[name];if(current==null)isPrefix[name]=is;else if(current!=is)throw new Error("Key binding "+name+" is used both as a regular binding and as a multi-stroke prefix");};let add=(scope,key,command,preventDefault,stopPropagation)=>{var _a,_b;let scopeObj=bound[scope]||(bound[scope]=Object.create(null));let parts=key.split(/ (?!$)/).map(k=>normalizeKeyName(k,platform));for(let i=1;i<parts.length;i++){let prefix=parts.slice(0,i).join(" ");checkPrefix(prefix,true);if(!scopeObj[prefix])scopeObj[prefix]={preventDefault:true,stopPropagation:false,run:[view=>{let ourObj=storedPrefix={view,prefix,scope};setTimeout(()=>{if(storedPrefix==ourObj)storedPrefix=null;},PrefixTimeout);return true;}]};}let full=parts.join(" ");checkPrefix(full,false);let binding=scopeObj[full]||(scopeObj[full]={preventDefault:false,stopPropagation:false,run:((_b=(_a=scopeObj._any)===null||_a===void 0?void 0:_a.run)===null||_b===void 0?void 0:_b.slice())||[]});if(command)binding.run.push(command);if(preventDefault)binding.preventDefault=true;if(stopPropagation)binding.stopPropagation=true;};for(let b of bindings){let scopes=b.scope?b.scope.split(" "):["editor"];if(b.any)for(let scope of scopes){let scopeObj=bound[scope]||(bound[scope]=Object.create(null));if(!scopeObj._any)scopeObj._any={preventDefault:false,stopPropagation:false,run:[]};for(let key in scopeObj)scopeObj[key].run.push(b.any);}let name=b[platform]||b.key;if(!name)continue;for(let scope of scopes){add(scope,name,b.run,b.preventDefault,b.stopPropagation);if(b.shift)add(scope,"Shift-"+name,b.shift,b.preventDefault,b.stopPropagation);}}return bound;}function runHandlers(map,event,view,scope){let name=keyName(event);let charCode=codePointAt(name,0),isChar=codePointSize(charCode)==name.length&&name!=" ";let prefix="",handled=false,prevented=false,stopPropagation=false;if(storedPrefix&&storedPrefix.view==view&&storedPrefix.scope==scope){prefix=storedPrefix.prefix+" ";if(modifierCodes.indexOf(event.keyCode)<0){prevented=true;storedPrefix=null;}}let ran=new Set();let runFor=binding=>{if(binding){for(let cmd of binding.run)if(!ran.has(cmd)){ran.add(cmd);if(cmd(view,event)){if(binding.stopPropagation)stopPropagation=true;return true;}}if(binding.preventDefault){if(binding.stopPropagation)stopPropagation=true;prevented=true;}}return false;};let scopeObj=map[scope],baseName,shiftName;if(scopeObj){if(runFor(scopeObj[prefix+modifiers(name,event,!isChar)])){handled=true;}else if(isChar&&(event.altKey||event.metaKey||event.ctrlKey)&&// Ctrl-Alt may be used for AltGr on Windows
!(browser.windows&&event.ctrlKey&&event.altKey)&&(baseName=base[event.keyCode])&&baseName!=name){if(runFor(scopeObj[prefix+modifiers(baseName,event,true)])){handled=true;}else if(event.shiftKey&&(shiftName=shift[event.keyCode])!=name&&shiftName!=baseName&&runFor(scopeObj[prefix+modifiers(shiftName,event,false)])){handled=true;}}else if(isChar&&event.shiftKey&&runFor(scopeObj[prefix+modifiers(name,event,true)])){handled=true;}if(!handled&&runFor(scopeObj._any))handled=true;}if(prevented)handled=true;if(handled&&stopPropagation)event.stopPropagation();return handled;}/**
  Implementation of [`LayerMarker`](https://codemirror.net/6/docs/ref/#view.LayerMarker) that creates
  a rectangle at a given set of coordinates.
  */class RectangleMarker{/**
      Create a marker with the given class and dimensions. If `width`
      is null, the DOM element will get no width style.
      */constructor(className,/**
      The left position of the marker (in pixels, document-relative).
      */left,/**
      The top position of the marker.
      */top,/**
      The width of the marker, or null if it shouldn't get a width assigned.
      */width,/**
      The height of the marker.
      */height){this.className=className;this.left=left;this.top=top;this.width=width;this.height=height;}draw(){let elt=document.createElement("div");elt.className=this.className;this.adjust(elt);return elt;}update(elt,prev){if(prev.className!=this.className)return false;this.adjust(elt);return true;}adjust(elt){elt.style.left=this.left+"px";elt.style.top=this.top+"px";if(this.width!=null)elt.style.width=this.width+"px";elt.style.height=this.height+"px";}eq(p){return this.left==p.left&&this.top==p.top&&this.width==p.width&&this.height==p.height&&this.className==p.className;}/**
      Create a set of rectangles for the given selection range,
      assigning them theclass`className`. Will create a single
      rectangle for empty ranges, and a set of selection-style
      rectangles covering the range's content (in a bidi-aware
      way) for non-empty ones.
      */static forRange(view,className,range){if(range.empty){let pos=view.coordsAtPos(range.head,range.assoc||1);if(!pos)return[];let base=getBase(view);return[new RectangleMarker(className,pos.left-base.left,pos.top-base.top,null,pos.bottom-pos.top)];}else{return rectanglesForRange(view,className,range);}}}function getBase(view){let rect=view.scrollDOM.getBoundingClientRect();let left=view.textDirection==Direction.LTR?rect.left:rect.right-view.scrollDOM.clientWidth*view.scaleX;return{left:left-view.scrollDOM.scrollLeft*view.scaleX,top:rect.top-view.scrollDOM.scrollTop*view.scaleY};}function wrappedLine(view,pos,inside){let range=EditorSelection.cursor(pos);return{from:Math.max(inside.from,view.moveToLineBoundary(range,false,true).from),to:Math.min(inside.to,view.moveToLineBoundary(range,true,true).from),type:BlockType.Text};}function rectanglesForRange(view,className,range){if(range.to<=view.viewport.from||range.from>=view.viewport.to)return[];let from=Math.max(range.from,view.viewport.from),to=Math.min(range.to,view.viewport.to);let ltr=view.textDirection==Direction.LTR;let content=view.contentDOM,contentRect=content.getBoundingClientRect(),base=getBase(view);let lineElt=content.querySelector(".cm-line"),lineStyle=lineElt&&window.getComputedStyle(lineElt);let leftSide=contentRect.left+(lineStyle?parseInt(lineStyle.paddingLeft)+Math.min(0,parseInt(lineStyle.textIndent)):0);let rightSide=contentRect.right-(lineStyle?parseInt(lineStyle.paddingRight):0);let startBlock=blockAt(view,from),endBlock=blockAt(view,to);let visualStart=startBlock.type==BlockType.Text?startBlock:null;let visualEnd=endBlock.type==BlockType.Text?endBlock:null;if(visualStart&&(view.lineWrapping||startBlock.widgetLineBreaks))visualStart=wrappedLine(view,from,visualStart);if(visualEnd&&(view.lineWrapping||endBlock.widgetLineBreaks))visualEnd=wrappedLine(view,to,visualEnd);if(visualStart&&visualEnd&&visualStart.from==visualEnd.from){return pieces(drawForLine(range.from,range.to,visualStart));}else{let top=visualStart?drawForLine(range.from,null,visualStart):drawForWidget(startBlock,false);let bottom=visualEnd?drawForLine(null,range.to,visualEnd):drawForWidget(endBlock,true);let between=[];if((visualStart||startBlock).to<(visualEnd||endBlock).from-(visualStart&&visualEnd?1:0)||startBlock.widgetLineBreaks>1&&top.bottom+view.defaultLineHeight/2<bottom.top)between.push(piece(leftSide,top.bottom,rightSide,bottom.top));else if(top.bottom<bottom.top&&view.elementAtHeight((top.bottom+bottom.top)/2).type==BlockType.Text)top.bottom=bottom.top=(top.bottom+bottom.top)/2;return pieces(top).concat(between).concat(pieces(bottom));}function piece(left,top,right,bottom){return new RectangleMarker(className,left-base.left,top-base.top-0.01/* C.Epsilon */,right-left,bottom-top+0.01/* C.Epsilon */);}function pieces({top,bottom,horizontal}){let pieces=[];for(let i=0;i<horizontal.length;i+=2)pieces.push(piece(horizontal[i],top,horizontal[i+1],bottom));return pieces;}// Gets passed from/to in line-local positions
function drawForLine(from,to,line){let top=1e9,bottom=-1e9,horizontal=[];function addSpan(from,fromOpen,to,toOpen,dir){// Passing 2/-2 is a kludge to force the view to return
// coordinates on the proper side of block widgets, since
// normalizing the side there, though appropriate for most
// coordsAtPos queries, would break selection drawing.
let fromCoords=view.coordsAtPos(from,from==line.to?-2:2);let toCoords=view.coordsAtPos(to,to==line.from?2:-2);if(!fromCoords||!toCoords)return;top=Math.min(fromCoords.top,toCoords.top,top);bottom=Math.max(fromCoords.bottom,toCoords.bottom,bottom);if(dir==Direction.LTR)horizontal.push(ltr&&fromOpen?leftSide:fromCoords.left,ltr&&toOpen?rightSide:toCoords.right);else horizontal.push(!ltr&&toOpen?leftSide:toCoords.left,!ltr&&fromOpen?rightSide:fromCoords.right);}let start=from!==null&&from!==void 0?from:line.from,end=to!==null&&to!==void 0?to:line.to;// Split the range by visible range and document line
for(let r of view.visibleRanges)if(r.to>start&&r.from<end){for(let pos=Math.max(r.from,start),endPos=Math.min(r.to,end);;){let docLine=view.state.doc.lineAt(pos);for(let span of view.bidiSpans(docLine)){let spanFrom=span.from+docLine.from,spanTo=span.to+docLine.from;if(spanFrom>=endPos)break;if(spanTo>pos)addSpan(Math.max(spanFrom,pos),from==null&&spanFrom<=start,Math.min(spanTo,endPos),to==null&&spanTo>=end,span.dir);}pos=docLine.to+1;if(pos>=endPos)break;}}if(horizontal.length==0)addSpan(start,from==null,end,to==null,view.textDirection);return{top,bottom,horizontal};}function drawForWidget(block,top){let y=contentRect.top+(top?block.top:block.bottom);return{top:y,bottom:y,horizontal:[]};}}function sameMarker(a,b){return a.constructor==b.constructor&&a.eq(b);}class LayerView{constructor(view,layer){this.view=view;this.layer=layer;this.drawn=[];this.scaleX=1;this.scaleY=1;this.measureReq={read:this.measure.bind(this),write:this.draw.bind(this)};this.dom=view.scrollDOM.appendChild(document.createElement("div"));this.dom.classList.add("cm-layer");if(layer.above)this.dom.classList.add("cm-layer-above");if(layer.class)this.dom.classList.add(layer.class);this.scale();this.dom.setAttribute("aria-hidden","true");this.setOrder(view.state);view.requestMeasure(this.measureReq);if(layer.mount)layer.mount(this.dom,view);}update(update){if(update.startState.facet(layerOrder)!=update.state.facet(layerOrder))this.setOrder(update.state);if(this.layer.update(update,this.dom)||update.geometryChanged){this.scale();update.view.requestMeasure(this.measureReq);}}docViewUpdate(view){if(this.layer.updateOnDocViewUpdate!==false)view.requestMeasure(this.measureReq);}setOrder(state){let pos=0,order=state.facet(layerOrder);while(pos<order.length&&order[pos]!=this.layer)pos++;this.dom.style.zIndex=String((this.layer.above?150:-1)-pos);}measure(){return this.layer.markers(this.view);}scale(){let{scaleX,scaleY}=this.view;if(scaleX!=this.scaleX||scaleY!=this.scaleY){this.scaleX=scaleX;this.scaleY=scaleY;this.dom.style.transform=`scale(${1/scaleX}, ${1/scaleY})`;}}draw(markers){if(markers.length!=this.drawn.length||markers.some((p,i)=>!sameMarker(p,this.drawn[i]))){let old=this.dom.firstChild,oldI=0;for(let marker of markers){if(marker.update&&old&&marker.constructor&&this.drawn[oldI].constructor&&marker.update(old,this.drawn[oldI])){old=old.nextSibling;oldI++;}else{this.dom.insertBefore(marker.draw(),old);}}while(old){let next=old.nextSibling;old.remove();old=next;}this.drawn=markers;}}destroy(){if(this.layer.destroy)this.layer.destroy(this.dom,this.view);this.dom.remove();}}const layerOrder=/*@__PURE__*/Facet.define();/**
  Define a layer.
  */function layer(config){return[ViewPlugin.define(v=>new LayerView(v,config)),layerOrder.of(config)];}const CanHidePrimary=!browser.ios;// FIXME test IE
const selectionConfig=/*@__PURE__*/Facet.define({combine(configs){return combineConfig(configs,{cursorBlinkRate:1200,drawRangeCursor:true},{cursorBlinkRate:(a,b)=>Math.min(a,b),drawRangeCursor:(a,b)=>a||b});}});/**
  Returns an extension that hides the browser's native selection and
  cursor, replacing the selection with a background behind the text
  (with the `cm-selectionBackground` class), and the
  cursors with elements overlaid over the code (using
  `cm-cursor-primary` and `cm-cursor-secondary`).

  This allows the editor to display secondary selection ranges, and
  tends to produce a type of selection more in line with that users
  expect in a text editor (the native selection styling will often
  leave gaps between lines and won't fill the horizontal space after
  a line when the selection continues past it).

  It does have a performance cost, in that it requires an extra DOM
  layout cycle for many updates (the selection is drawn based on DOM
  layout information that's only available after laying out the
  content).
  */function drawSelection(config={}){return[selectionConfig.of(config),cursorLayer,selectionLayer,hideNativeSelection,nativeSelectionHidden.of(true)];}function configChanged(update){return update.startState.facet(selectionConfig)!=update.state.facet(selectionConfig);}const cursorLayer=/*@__PURE__*/layer({above:true,markers(view){let{state}=view,conf=state.facet(selectionConfig);let cursors=[];for(let r of state.selection.ranges){let prim=r==state.selection.main;if(r.empty?!prim||CanHidePrimary:conf.drawRangeCursor){let className=prim?"cm-cursor cm-cursor-primary":"cm-cursor cm-cursor-secondary";let cursor=r.empty?r:EditorSelection.cursor(r.head,r.head>r.anchor?-1:1);for(let piece of RectangleMarker.forRange(view,className,cursor))cursors.push(piece);}}return cursors;},update(update,dom){if(update.transactions.some(tr=>tr.selection))dom.style.animationName=dom.style.animationName=="cm-blink"?"cm-blink2":"cm-blink";let confChange=configChanged(update);if(confChange)setBlinkRate(update.state,dom);return update.docChanged||update.selectionSet||confChange;},mount(dom,view){setBlinkRate(view.state,dom);},class:"cm-cursorLayer"});function setBlinkRate(state,dom){dom.style.animationDuration=state.facet(selectionConfig).cursorBlinkRate+"ms";}const selectionLayer=/*@__PURE__*/layer({above:false,markers(view){return view.state.selection.ranges.map(r=>r.empty?[]:RectangleMarker.forRange(view,"cm-selectionBackground",r)).reduce((a,b)=>a.concat(b));},update(update,dom){return update.docChanged||update.selectionSet||update.viewportChanged||configChanged(update);},class:"cm-selectionLayer"});const themeSpec={".cm-line":{"& ::selection":{backgroundColor:"transparent !important"},"&::selection":{backgroundColor:"transparent !important"}}};if(CanHidePrimary){themeSpec[".cm-line"].caretColor="transparent !important";themeSpec[".cm-content"]={caretColor:"transparent !important"};}const hideNativeSelection=/*@__PURE__*/Prec.highest(/*@__PURE__*/EditorView.theme(themeSpec));const setDropCursorPos=/*@__PURE__*/StateEffect.define({map(pos,mapping){return pos==null?null:mapping.mapPos(pos);}});const dropCursorPos=/*@__PURE__*/StateField.define({create(){return null;},update(pos,tr){if(pos!=null)pos=tr.changes.mapPos(pos);return tr.effects.reduce((pos,e)=>e.is(setDropCursorPos)?e.value:pos,pos);}});const drawDropCursor=/*@__PURE__*/ViewPlugin.fromClass(class{constructor(view){this.view=view;this.cursor=null;this.measureReq={read:this.readPos.bind(this),write:this.drawCursor.bind(this)};}update(update){var _a;let cursorPos=update.state.field(dropCursorPos);if(cursorPos==null){if(this.cursor!=null){(_a=this.cursor)===null||_a===void 0?void 0:_a.remove();this.cursor=null;}}else{if(!this.cursor){this.cursor=this.view.scrollDOM.appendChild(document.createElement("div"));this.cursor.className="cm-dropCursor";}if(update.startState.field(dropCursorPos)!=cursorPos||update.docChanged||update.geometryChanged)this.view.requestMeasure(this.measureReq);}}readPos(){let{view}=this;let pos=view.state.field(dropCursorPos);let rect=pos!=null&&view.coordsAtPos(pos);if(!rect)return null;let outer=view.scrollDOM.getBoundingClientRect();return{left:rect.left-outer.left+view.scrollDOM.scrollLeft*view.scaleX,top:rect.top-outer.top+view.scrollDOM.scrollTop*view.scaleY,height:rect.bottom-rect.top};}drawCursor(pos){if(this.cursor){let{scaleX,scaleY}=this.view;if(pos){this.cursor.style.left=pos.left/scaleX+"px";this.cursor.style.top=pos.top/scaleY+"px";this.cursor.style.height=pos.height/scaleY+"px";}else{this.cursor.style.left="-100000px";}}}destroy(){if(this.cursor)this.cursor.remove();}setDropPos(pos){if(this.view.state.field(dropCursorPos)!=pos)this.view.dispatch({effects:setDropCursorPos.of(pos)});}},{eventObservers:{dragover(event){this.setDropPos(this.view.posAtCoords({x:event.clientX,y:event.clientY}));},dragleave(event){if(event.target==this.view.contentDOM||!this.view.contentDOM.contains(event.relatedTarget))this.setDropPos(null);},dragend(){this.setDropPos(null);},drop(){this.setDropPos(null);}}});/**
  Draws a cursor at the current drop position when something is
  dragged over the editor.
  */function dropCursor(){return[dropCursorPos,drawDropCursor];}function iterMatches(doc,re,from,to,f){re.lastIndex=0;for(let cursor=doc.iterRange(from,to),pos=from,m;!cursor.next().done;pos+=cursor.value.length){if(!cursor.lineBreak)while(m=re.exec(cursor.value))f(pos+m.index,m);}}function matchRanges(view,maxLength){let visible=view.visibleRanges;if(visible.length==1&&visible[0].from==view.viewport.from&&visible[0].to==view.viewport.to)return visible;let result=[];for(let{from,to}of visible){from=Math.max(view.state.doc.lineAt(from).from,from-maxLength);to=Math.min(view.state.doc.lineAt(to).to,to+maxLength);if(result.length&&result[result.length-1].to>=from)result[result.length-1].to=to;else result.push({from,to});}return result;}/**
  Helper class used to make it easier to maintain decorations on
  visible code that matches a given regular expression. To be used
  in a [view plugin](https://codemirror.net/6/docs/ref/#view.ViewPlugin). Instances of this object
  represent a matching configuration.
  */class MatchDecorator{/**
      Create a decorator.
      */constructor(config){const{regexp,decoration,decorate,boundary,maxLength=1000}=config;if(!regexp.global)throw new RangeError("The regular expression given to MatchDecorator should have its 'g' flag set");this.regexp=regexp;if(decorate){this.addMatch=(match,view,from,add)=>decorate(add,from,from+match[0].length,match,view);}else if(typeof decoration=="function"){this.addMatch=(match,view,from,add)=>{let deco=decoration(match,view,from);if(deco)add(from,from+match[0].length,deco);};}else if(decoration){this.addMatch=(match,_view,from,add)=>add(from,from+match[0].length,decoration);}else{throw new RangeError("Either 'decorate' or 'decoration' should be provided to MatchDecorator");}this.boundary=boundary;this.maxLength=maxLength;}/**
      Compute the full set of decorations for matches in the given
      view's viewport. You'll want to call this when initializing your
      plugin.
      */createDeco(view){let build=new RangeSetBuilder(),add=build.add.bind(build);for(let{from,to}of matchRanges(view,this.maxLength))iterMatches(view.state.doc,this.regexp,from,to,(from,m)=>this.addMatch(m,view,from,add));return build.finish();}/**
      Update a set of decorations for a view update. `deco` _must_ be
      the set of decorations produced by _this_ `MatchDecorator` for
      the view state before the update.
      */updateDeco(update,deco){let changeFrom=1e9,changeTo=-1;if(update.docChanged)update.changes.iterChanges((_f,_t,from,to)=>{if(to>update.view.viewport.from&&from<update.view.viewport.to){changeFrom=Math.min(from,changeFrom);changeTo=Math.max(to,changeTo);}});if(update.viewportChanged||changeTo-changeFrom>1000)return this.createDeco(update.view);if(changeTo>-1)return this.updateRange(update.view,deco.map(update.changes),changeFrom,changeTo);return deco;}updateRange(view,deco,updateFrom,updateTo){for(let r of view.visibleRanges){let from=Math.max(r.from,updateFrom),to=Math.min(r.to,updateTo);if(to>from){let fromLine=view.state.doc.lineAt(from),toLine=fromLine.to<to?view.state.doc.lineAt(to):fromLine;let start=Math.max(r.from,fromLine.from),end=Math.min(r.to,toLine.to);if(this.boundary){for(;from>fromLine.from;from--)if(this.boundary.test(fromLine.text[from-1-fromLine.from])){start=from;break;}for(;to<toLine.to;to++)if(this.boundary.test(toLine.text[to-toLine.from])){end=to;break;}}let ranges=[],m;let add=(from,to,deco)=>ranges.push(deco.range(from,to));if(fromLine==toLine){this.regexp.lastIndex=start-fromLine.from;while((m=this.regexp.exec(fromLine.text))&&m.index<end-fromLine.from)this.addMatch(m,view,m.index+fromLine.from,add);}else{iterMatches(view.state.doc,this.regexp,start,end,(from,m)=>this.addMatch(m,view,from,add));}deco=deco.update({filterFrom:start,filterTo:end,filter:(from,to)=>from<start||to>end,add:ranges});}}return deco;}}const UnicodeRegexpSupport=/x/.unicode!=null?"gu":"g";const Specials=/*@__PURE__*/new RegExp("[\u0000-\u0008\u000a-\u001f\u007f-\u009f\u00ad\u061c\u200b\u200e\u200f\u2028\u2029\u202d\u202e\u2066\u2067\u2069\ufeff\ufff9-\ufffc]",UnicodeRegexpSupport);const Names={0:"null",7:"bell",8:"backspace",10:"newline",11:"vertical tab",13:"carriage return",27:"escape",8203:"zero width space",8204:"zero width non-joiner",8205:"zero width joiner",8206:"left-to-right mark",8207:"right-to-left mark",8232:"line separator",8237:"left-to-right override",8238:"right-to-left override",8294:"left-to-right isolate",8295:"right-to-left isolate",8297:"pop directional isolate",8233:"paragraph separator",65279:"zero width no-break space",65532:"object replacement"};let _supportsTabSize=null;function supportsTabSize(){var _a;if(_supportsTabSize==null&&typeof document!="undefined"&&document.body){let styles=document.body.style;_supportsTabSize=((_a=styles.tabSize)!==null&&_a!==void 0?_a:styles.MozTabSize)!=null;}return _supportsTabSize||false;}const specialCharConfig=/*@__PURE__*/Facet.define({combine(configs){let config=combineConfig(configs,{render:null,specialChars:Specials,addSpecialChars:null});if(config.replaceTabs=!supportsTabSize())config.specialChars=new RegExp("\t|"+config.specialChars.source,UnicodeRegexpSupport);if(config.addSpecialChars)config.specialChars=new RegExp(config.specialChars.source+"|"+config.addSpecialChars.source,UnicodeRegexpSupport);return config;}});/**
  Returns an extension that installs highlighting of special
  characters.
  */function highlightSpecialChars(/**
  Configuration options.
  */config={}){return[specialCharConfig.of(config),specialCharPlugin()];}let _plugin=null;function specialCharPlugin(){return _plugin||(_plugin=ViewPlugin.fromClass(class{constructor(view){this.view=view;this.decorations=Decoration.none;this.decorationCache=Object.create(null);this.decorator=this.makeDecorator(view.state.facet(specialCharConfig));this.decorations=this.decorator.createDeco(view);}makeDecorator(conf){return new MatchDecorator({regexp:conf.specialChars,decoration:(m,view,pos)=>{let{doc}=view.state;let code=codePointAt(m[0],0);if(code==9){let line=doc.lineAt(pos);let size=view.state.tabSize,col=countColumn(line.text,size,pos-line.from);return Decoration.replace({widget:new TabWidget((size-col%size)*this.view.defaultCharacterWidth/this.view.scaleX)});}return this.decorationCache[code]||(this.decorationCache[code]=Decoration.replace({widget:new SpecialCharWidget(conf,code)}));},boundary:conf.replaceTabs?undefined:/[^]/});}update(update){let conf=update.state.facet(specialCharConfig);if(update.startState.facet(specialCharConfig)!=conf){this.decorator=this.makeDecorator(conf);this.decorations=this.decorator.createDeco(update.view);}else{this.decorations=this.decorator.updateDeco(update,this.decorations);}}},{decorations:v=>v.decorations}));}const DefaultPlaceholder="\u2022";// Assigns placeholder characters from the Control Pictures block to
// ASCII control characters
function placeholder$1(code){if(code>=32)return DefaultPlaceholder;if(code==10)return"\u2424";return String.fromCharCode(9216+code);}class SpecialCharWidget extends WidgetType{constructor(options,code){super();this.options=options;this.code=code;}eq(other){return other.code==this.code;}toDOM(view){let ph=placeholder$1(this.code);let desc=view.state.phrase("Control character")+" "+(Names[this.code]||"0x"+this.code.toString(16));let custom=this.options.render&&this.options.render(this.code,desc,ph);if(custom)return custom;let span=document.createElement("span");span.textContent=ph;span.title=desc;span.setAttribute("aria-label",desc);span.className="cm-specialChar";return span;}ignoreEvent(){return false;}}class TabWidget extends WidgetType{constructor(width){super();this.width=width;}eq(other){return other.width==this.width;}toDOM(){let span=document.createElement("span");span.textContent="\t";span.className="cm-tab";span.style.width=this.width+"px";return span;}ignoreEvent(){return false;}}/**
  Mark lines that have a cursor on them with the `"cm-activeLine"`
  DOM class.
  */function highlightActiveLine(){return activeLineHighlighter;}const lineDeco=/*@__PURE__*/Decoration.line({class:"cm-activeLine"});const activeLineHighlighter=/*@__PURE__*/ViewPlugin.fromClass(class{constructor(view){this.decorations=this.getDeco(view);}update(update){if(update.docChanged||update.selectionSet)this.decorations=this.getDeco(update.view);}getDeco(view){let lastLineStart=-1,deco=[];for(let r of view.state.selection.ranges){let line=view.lineBlockAt(r.head);if(line.from>lastLineStart){deco.push(lineDeco.range(line.from));lastLineStart=line.from;}}return Decoration.set(deco);}},{decorations:v=>v.decorations});// Don't compute precise column positions for line offsets above this
// (since it could get expensive). Assume offset==column for them.
const MaxOff=2000;function rectangleFor(state,a,b){let startLine=Math.min(a.line,b.line),endLine=Math.max(a.line,b.line);let ranges=[];if(a.off>MaxOff||b.off>MaxOff||a.col<0||b.col<0){let startOff=Math.min(a.off,b.off),endOff=Math.max(a.off,b.off);for(let i=startLine;i<=endLine;i++){let line=state.doc.line(i);if(line.length<=endOff)ranges.push(EditorSelection.range(line.from+startOff,line.to+endOff));}}else{let startCol=Math.min(a.col,b.col),endCol=Math.max(a.col,b.col);for(let i=startLine;i<=endLine;i++){let line=state.doc.line(i);let start=findColumn(line.text,startCol,state.tabSize,true);if(start<0){ranges.push(EditorSelection.cursor(line.to));}else{let end=findColumn(line.text,endCol,state.tabSize);ranges.push(EditorSelection.range(line.from+start,line.from+end));}}}return ranges;}function absoluteColumn(view,x){let ref=view.coordsAtPos(view.viewport.from);return ref?Math.round(Math.abs((ref.left-x)/view.defaultCharacterWidth)):-1;}function getPos(view,event){let offset=view.posAtCoords({x:event.clientX,y:event.clientY},false);let line=view.state.doc.lineAt(offset),off=offset-line.from;let col=off>MaxOff?-1:off==line.length?absoluteColumn(view,event.clientX):countColumn(line.text,view.state.tabSize,offset-line.from);return{line:line.number,col,off};}function rectangleSelectionStyle(view,event){let start=getPos(view,event),startSel=view.state.selection;if(!start)return null;return{update(update){if(update.docChanged){let newStart=update.changes.mapPos(update.startState.doc.line(start.line).from);let newLine=update.state.doc.lineAt(newStart);start={line:newLine.number,col:start.col,off:Math.min(start.off,newLine.length)};startSel=startSel.map(update.changes);}},get(event,_extend,multiple){let cur=getPos(view,event);if(!cur)return startSel;let ranges=rectangleFor(view.state,start,cur);if(!ranges.length)return startSel;if(multiple)return EditorSelection.create(ranges.concat(startSel.ranges));else return EditorSelection.create(ranges);}};}/**
  Create an extension that enables rectangular selections. By
  default, it will react to left mouse drag with the Alt key held
  down. When such a selection occurs, the text within the rectangle
  that was dragged over will be selected, as one selection
  [range](https://codemirror.net/6/docs/ref/#state.SelectionRange) per line.
  */function rectangularSelection(options){let filter=e=>e.altKey&&e.button==0;return EditorView.mouseSelectionStyle.of((view,event)=>filter(event)?rectangleSelectionStyle(view,event):null);}const keys={Alt:[18,e=>!!e.altKey],Control:[17,e=>!!e.ctrlKey],Shift:[16,e=>!!e.shiftKey],Meta:[91,e=>!!e.metaKey]};const showCrosshair={style:"cursor: crosshair"};/**
  Returns an extension that turns the pointer cursor into a
  crosshair when a given modifier key, defaulting to Alt, is held
  down. Can serve as a visual hint that rectangular selection is
  going to happen when paired with
  [`rectangularSelection`](https://codemirror.net/6/docs/ref/#view.rectangularSelection).
  */function crosshairCursor(options={}){let[code,getter]=keys[options.key||"Alt"];let plugin=ViewPlugin.fromClass(class{constructor(view){this.view=view;this.isDown=false;}set(isDown){if(this.isDown!=isDown){this.isDown=isDown;this.view.update([]);}}},{eventObservers:{keydown(e){this.set(e.keyCode==code||getter(e));},keyup(e){if(e.keyCode==code||!getter(e))this.set(false);},mousemove(e){this.set(getter(e));}}});return[plugin,EditorView.contentAttributes.of(view=>{var _a;return((_a=view.plugin(plugin))===null||_a===void 0?void 0:_a.isDown)?showCrosshair:null;})];}const Outside="-10000px";class TooltipViewManager{constructor(view,facet,createTooltipView,removeTooltipView){this.facet=facet;this.createTooltipView=createTooltipView;this.removeTooltipView=removeTooltipView;this.input=view.state.facet(facet);this.tooltips=this.input.filter(t=>t);let prev=null;this.tooltipViews=this.tooltips.map(t=>prev=createTooltipView(t,prev));}update(update,above){var _a;let input=update.state.facet(this.facet);let tooltips=input.filter(x=>x);if(input===this.input){for(let t of this.tooltipViews)if(t.update)t.update(update);return false;}let tooltipViews=[],newAbove=above?[]:null;for(let i=0;i<tooltips.length;i++){let tip=tooltips[i],known=-1;if(!tip)continue;for(let i=0;i<this.tooltips.length;i++){let other=this.tooltips[i];if(other&&other.create==tip.create)known=i;}if(known<0){tooltipViews[i]=this.createTooltipView(tip,i?tooltipViews[i-1]:null);if(newAbove)newAbove[i]=!!tip.above;}else{let tooltipView=tooltipViews[i]=this.tooltipViews[known];if(newAbove)newAbove[i]=above[known];if(tooltipView.update)tooltipView.update(update);}}for(let t of this.tooltipViews)if(tooltipViews.indexOf(t)<0){this.removeTooltipView(t);(_a=t.destroy)===null||_a===void 0?void 0:_a.call(t);}if(above){newAbove.forEach((val,i)=>above[i]=val);above.length=newAbove.length;}this.input=input;this.tooltips=tooltips;this.tooltipViews=tooltipViews;return true;}}function windowSpace(view){let{win}=view;return{top:0,left:0,bottom:win.innerHeight,right:win.innerWidth};}const tooltipConfig=/*@__PURE__*/Facet.define({combine:values=>{var _a,_b,_c;return{position:browser.ios?"absolute":((_a=values.find(conf=>conf.position))===null||_a===void 0?void 0:_a.position)||"fixed",parent:((_b=values.find(conf=>conf.parent))===null||_b===void 0?void 0:_b.parent)||null,tooltipSpace:((_c=values.find(conf=>conf.tooltipSpace))===null||_c===void 0?void 0:_c.tooltipSpace)||windowSpace};}});const knownHeight=/*@__PURE__*/new WeakMap();const tooltipPlugin=/*@__PURE__*/ViewPlugin.fromClass(class{constructor(view){this.view=view;this.above=[];this.inView=true;this.madeAbsolute=false;this.lastTransaction=0;this.measureTimeout=-1;let config=view.state.facet(tooltipConfig);this.position=config.position;this.parent=config.parent;this.classes=view.themeClasses;this.createContainer();this.measureReq={read:this.readMeasure.bind(this),write:this.writeMeasure.bind(this),key:this};this.resizeObserver=typeof ResizeObserver=="function"?new ResizeObserver(()=>this.measureSoon()):null;this.manager=new TooltipViewManager(view,showTooltip,(t,p)=>this.createTooltip(t,p),t=>{if(this.resizeObserver)this.resizeObserver.unobserve(t.dom);t.dom.remove();});this.above=this.manager.tooltips.map(t=>!!t.above);this.intersectionObserver=typeof IntersectionObserver=="function"?new IntersectionObserver(entries=>{if(Date.now()>this.lastTransaction-50&&entries.length>0&&entries[entries.length-1].intersectionRatio<1)this.measureSoon();},{threshold:[1]}):null;this.observeIntersection();view.win.addEventListener("resize",this.measureSoon=this.measureSoon.bind(this));this.maybeMeasure();}createContainer(){if(this.parent){this.container=document.createElement("div");this.container.style.position="relative";this.container.className=this.view.themeClasses;this.parent.appendChild(this.container);}else{this.container=this.view.dom;}}observeIntersection(){if(this.intersectionObserver){this.intersectionObserver.disconnect();for(let tooltip of this.manager.tooltipViews)this.intersectionObserver.observe(tooltip.dom);}}measureSoon(){if(this.measureTimeout<0)this.measureTimeout=setTimeout(()=>{this.measureTimeout=-1;this.maybeMeasure();},50);}update(update){if(update.transactions.length)this.lastTransaction=Date.now();let updated=this.manager.update(update,this.above);if(updated)this.observeIntersection();let shouldMeasure=updated||update.geometryChanged;let newConfig=update.state.facet(tooltipConfig);if(newConfig.position!=this.position&&!this.madeAbsolute){this.position=newConfig.position;for(let t of this.manager.tooltipViews)t.dom.style.position=this.position;shouldMeasure=true;}if(newConfig.parent!=this.parent){if(this.parent)this.container.remove();this.parent=newConfig.parent;this.createContainer();for(let t of this.manager.tooltipViews)this.container.appendChild(t.dom);shouldMeasure=true;}else if(this.parent&&this.view.themeClasses!=this.classes){this.classes=this.container.className=this.view.themeClasses;}if(shouldMeasure)this.maybeMeasure();}createTooltip(tooltip,prev){let tooltipView=tooltip.create(this.view);let before=prev?prev.dom:null;tooltipView.dom.classList.add("cm-tooltip");if(tooltip.arrow&&!tooltipView.dom.querySelector(".cm-tooltip > .cm-tooltip-arrow")){let arrow=document.createElement("div");arrow.className="cm-tooltip-arrow";tooltipView.dom.insertBefore(arrow,before);}tooltipView.dom.style.position=this.position;tooltipView.dom.style.top=Outside;tooltipView.dom.style.left="0px";this.container.insertBefore(tooltipView.dom,before);if(tooltipView.mount)tooltipView.mount(this.view);if(this.resizeObserver)this.resizeObserver.observe(tooltipView.dom);return tooltipView;}destroy(){var _a,_b,_c;this.view.win.removeEventListener("resize",this.measureSoon);for(let tooltipView of this.manager.tooltipViews){tooltipView.dom.remove();(_a=tooltipView.destroy)===null||_a===void 0?void 0:_a.call(tooltipView);}if(this.parent)this.container.remove();(_b=this.resizeObserver)===null||_b===void 0?void 0:_b.disconnect();(_c=this.intersectionObserver)===null||_c===void 0?void 0:_c.disconnect();clearTimeout(this.measureTimeout);}readMeasure(){let editor=this.view.dom.getBoundingClientRect();let scaleX=1,scaleY=1,makeAbsolute=false;if(this.position=="fixed"&&this.manager.tooltipViews.length){let{dom}=this.manager.tooltipViews[0];if(browser.gecko){// Firefox sets the element's `offsetParent` to the
// transformed element when a transform interferes with fixed
// positioning.
makeAbsolute=dom.offsetParent!=this.container.ownerDocument.body;}else if(dom.style.top==Outside&&dom.style.left=="0px"){// On other browsers, we have to awkwardly try and use other
// information to detect a transform.
let rect=dom.getBoundingClientRect();makeAbsolute=Math.abs(rect.top+10000)>1||Math.abs(rect.left)>1;}}if(makeAbsolute||this.position=="absolute"){if(this.parent){let rect=this.parent.getBoundingClientRect();if(rect.width&&rect.height){scaleX=rect.width/this.parent.offsetWidth;scaleY=rect.height/this.parent.offsetHeight;}}else{({scaleX,scaleY}=this.view.viewState);}}return{editor,parent:this.parent?this.container.getBoundingClientRect():editor,pos:this.manager.tooltips.map((t,i)=>{let tv=this.manager.tooltipViews[i];return tv.getCoords?tv.getCoords(t.pos):this.view.coordsAtPos(t.pos);}),size:this.manager.tooltipViews.map(({dom})=>dom.getBoundingClientRect()),space:this.view.state.facet(tooltipConfig).tooltipSpace(this.view),scaleX,scaleY,makeAbsolute};}writeMeasure(measured){var _a;if(measured.makeAbsolute){this.madeAbsolute=true;this.position="absolute";for(let t of this.manager.tooltipViews)t.dom.style.position="absolute";}let{editor,space,scaleX,scaleY}=measured;let others=[];for(let i=0;i<this.manager.tooltips.length;i++){let tooltip=this.manager.tooltips[i],tView=this.manager.tooltipViews[i],{dom}=tView;let pos=measured.pos[i],size=measured.size[i];// Hide tooltips that are outside of the editor.
if(!pos||pos.bottom<=Math.max(editor.top,space.top)||pos.top>=Math.min(editor.bottom,space.bottom)||pos.right<Math.max(editor.left,space.left)-.1||pos.left>Math.min(editor.right,space.right)+.1){dom.style.top=Outside;continue;}let arrow=tooltip.arrow?tView.dom.querySelector(".cm-tooltip-arrow"):null;let arrowHeight=arrow?7/* Arrow.Size */:0;let width=size.right-size.left,height=(_a=knownHeight.get(tView))!==null&&_a!==void 0?_a:size.bottom-size.top;let offset=tView.offset||noOffset,ltr=this.view.textDirection==Direction.LTR;let left=size.width>space.right-space.left?ltr?space.left:space.right-size.width:ltr?Math.min(pos.left-(arrow?14/* Arrow.Offset */:0)+offset.x,space.right-width):Math.max(space.left,pos.left-width+(arrow?14/* Arrow.Offset */:0)-offset.x);let above=this.above[i];if(!tooltip.strictSide&&(above?pos.top-(size.bottom-size.top)-offset.y<space.top:pos.bottom+(size.bottom-size.top)+offset.y>space.bottom)&&above==space.bottom-pos.bottom>pos.top-space.top)above=this.above[i]=!above;let spaceVert=(above?pos.top-space.top:space.bottom-pos.bottom)-arrowHeight;if(spaceVert<height&&tView.resize!==false){if(spaceVert<this.view.defaultLineHeight){dom.style.top=Outside;continue;}knownHeight.set(tView,height);dom.style.height=(height=spaceVert)/scaleY+"px";}else if(dom.style.height){dom.style.height="";}let top=above?pos.top-height-arrowHeight-offset.y:pos.bottom+arrowHeight+offset.y;let right=left+width;if(tView.overlap!==true)for(let r of others)if(r.left<right&&r.right>left&&r.top<top+height&&r.bottom>top)top=above?r.top-height-2-arrowHeight:r.bottom+arrowHeight+2;if(this.position=="absolute"){dom.style.top=(top-measured.parent.top)/scaleY+"px";dom.style.left=(left-measured.parent.left)/scaleX+"px";}else{dom.style.top=top/scaleY+"px";dom.style.left=left/scaleX+"px";}if(arrow){let arrowLeft=pos.left+(ltr?offset.x:-offset.x)-(left+14/* Arrow.Offset */-7/* Arrow.Size */);arrow.style.left=arrowLeft/scaleX+"px";}if(tView.overlap!==true)others.push({left,top,right,bottom:top+height});dom.classList.toggle("cm-tooltip-above",above);dom.classList.toggle("cm-tooltip-below",!above);if(tView.positioned)tView.positioned(measured.space);}}maybeMeasure(){if(this.manager.tooltips.length){if(this.view.inView)this.view.requestMeasure(this.measureReq);if(this.inView!=this.view.inView){this.inView=this.view.inView;if(!this.inView)for(let tv of this.manager.tooltipViews)tv.dom.style.top=Outside;}}}},{eventObservers:{scroll(){this.maybeMeasure();}}});const baseTheme$4=/*@__PURE__*/EditorView.baseTheme({".cm-tooltip":{zIndex:100,boxSizing:"border-box"},"&light .cm-tooltip":{border:"1px solid #bbb",backgroundColor:"#f5f5f5"},"&light .cm-tooltip-section:not(:first-child)":{borderTop:"1px solid #bbb"},"&dark .cm-tooltip":{backgroundColor:"#333338",color:"white"},".cm-tooltip-arrow":{height:`${7/* Arrow.Size */}px`,width:`${7/* Arrow.Size */*2}px`,position:"absolute",zIndex:-1,overflow:"hidden","&:before, &:after":{content:"''",position:"absolute",width:0,height:0,borderLeft:`${7/* Arrow.Size */}px solid transparent`,borderRight:`${7/* Arrow.Size */}px solid transparent`},".cm-tooltip-above &":{bottom:`-${7/* Arrow.Size */}px`,"&:before":{borderTop:`${7/* Arrow.Size */}px solid #bbb`},"&:after":{borderTop:`${7/* Arrow.Size */}px solid #f5f5f5`,bottom:"1px"}},".cm-tooltip-below &":{top:`-${7/* Arrow.Size */}px`,"&:before":{borderBottom:`${7/* Arrow.Size */}px solid #bbb`},"&:after":{borderBottom:`${7/* Arrow.Size */}px solid #f5f5f5`,top:"1px"}}},"&dark .cm-tooltip .cm-tooltip-arrow":{"&:before":{borderTopColor:"#333338",borderBottomColor:"#333338"},"&:after":{borderTopColor:"transparent",borderBottomColor:"transparent"}}});const noOffset={x:0,y:0};/**
  Facet to which an extension can add a value to show a tooltip.
  */const showTooltip=/*@__PURE__*/Facet.define({enables:[tooltipPlugin,baseTheme$4]});const showHoverTooltip=/*@__PURE__*/Facet.define({combine:inputs=>inputs.reduce((a,i)=>a.concat(i),[])});class HoverTooltipHost{// Needs to be static so that host tooltip instances always match
static create(view){return new HoverTooltipHost(view);}constructor(view){this.view=view;this.mounted=false;this.dom=document.createElement("div");this.dom.classList.add("cm-tooltip-hover");this.manager=new TooltipViewManager(view,showHoverTooltip,(t,p)=>this.createHostedView(t,p),t=>t.dom.remove());}createHostedView(tooltip,prev){let hostedView=tooltip.create(this.view);hostedView.dom.classList.add("cm-tooltip-section");this.dom.insertBefore(hostedView.dom,prev?prev.dom.nextSibling:this.dom.firstChild);if(this.mounted&&hostedView.mount)hostedView.mount(this.view);return hostedView;}mount(view){for(let hostedView of this.manager.tooltipViews){if(hostedView.mount)hostedView.mount(view);}this.mounted=true;}positioned(space){for(let hostedView of this.manager.tooltipViews){if(hostedView.positioned)hostedView.positioned(space);}}update(update){this.manager.update(update);}destroy(){var _a;for(let t of this.manager.tooltipViews)(_a=t.destroy)===null||_a===void 0?void 0:_a.call(t);}passProp(name){let value=undefined;for(let view of this.manager.tooltipViews){let given=view[name];if(given!==undefined){if(value===undefined)value=given;else if(value!==given)return undefined;}}return value;}get offset(){return this.passProp("offset");}get getCoords(){return this.passProp("getCoords");}get overlap(){return this.passProp("overlap");}get resize(){return this.passProp("resize");}}const showHoverTooltipHost=/*@__PURE__*/showTooltip.compute([showHoverTooltip],state=>{let tooltips=state.facet(showHoverTooltip);if(tooltips.length===0)return null;return{pos:Math.min(...tooltips.map(t=>t.pos)),end:Math.max(...tooltips.map(t=>{var _a;return(_a=t.end)!==null&&_a!==void 0?_a:t.pos;})),create:HoverTooltipHost.create,above:tooltips[0].above,arrow:tooltips.some(t=>t.arrow)};});class HoverPlugin{constructor(view,source,field,setHover,hoverTime){this.view=view;this.source=source;this.field=field;this.setHover=setHover;this.hoverTime=hoverTime;this.hoverTimeout=-1;this.restartTimeout=-1;this.pending=null;this.lastMove={x:0,y:0,target:view.dom,time:0};this.checkHover=this.checkHover.bind(this);view.dom.addEventListener("mouseleave",this.mouseleave=this.mouseleave.bind(this));view.dom.addEventListener("mousemove",this.mousemove=this.mousemove.bind(this));}update(){if(this.pending){this.pending=null;clearTimeout(this.restartTimeout);this.restartTimeout=setTimeout(()=>this.startHover(),20);}}get active(){return this.view.state.field(this.field);}checkHover(){this.hoverTimeout=-1;if(this.active.length)return;let hovered=Date.now()-this.lastMove.time;if(hovered<this.hoverTime)this.hoverTimeout=setTimeout(this.checkHover,this.hoverTime-hovered);else this.startHover();}startHover(){clearTimeout(this.restartTimeout);let{view,lastMove}=this;let desc=view.docView.nearest(lastMove.target);if(!desc)return;let pos,side=1;if(desc instanceof WidgetView){pos=desc.posAtStart;}else{pos=view.posAtCoords(lastMove);if(pos==null)return;let posCoords=view.coordsAtPos(pos);if(!posCoords||lastMove.y<posCoords.top||lastMove.y>posCoords.bottom||lastMove.x<posCoords.left-view.defaultCharacterWidth||lastMove.x>posCoords.right+view.defaultCharacterWidth)return;let bidi=view.bidiSpans(view.state.doc.lineAt(pos)).find(s=>s.from<=pos&&s.to>=pos);let rtl=bidi&&bidi.dir==Direction.RTL?-1:1;side=lastMove.x<posCoords.left?-rtl:rtl;}let open=this.source(view,pos,side);if(open===null||open===void 0?void 0:open.then){let pending=this.pending={pos};open.then(result=>{if(this.pending==pending){this.pending=null;if(result&&!(Array.isArray(result)&&!result.length))view.dispatch({effects:this.setHover.of(Array.isArray(result)?result:[result])});}},e=>logException(view.state,e,"hover tooltip"));}else if(open&&!(Array.isArray(open)&&!open.length)){view.dispatch({effects:this.setHover.of(Array.isArray(open)?open:[open])});}}get tooltip(){let plugin=this.view.plugin(tooltipPlugin);let index=plugin?plugin.manager.tooltips.findIndex(t=>t.create==HoverTooltipHost.create):-1;return index>-1?plugin.manager.tooltipViews[index]:null;}mousemove(event){var _a,_b;this.lastMove={x:event.clientX,y:event.clientY,target:event.target,time:Date.now()};if(this.hoverTimeout<0)this.hoverTimeout=setTimeout(this.checkHover,this.hoverTime);let{active,tooltip}=this;if(active.length&&tooltip&&!isInTooltip(tooltip.dom,event)||this.pending){let{pos}=active[0]||this.pending,end=(_b=(_a=active[0])===null||_a===void 0?void 0:_a.end)!==null&&_b!==void 0?_b:pos;if(pos==end?this.view.posAtCoords(this.lastMove)!=pos:!isOverRange(this.view,pos,end,event.clientX,event.clientY)){this.view.dispatch({effects:this.setHover.of([])});this.pending=null;}}}mouseleave(event){clearTimeout(this.hoverTimeout);this.hoverTimeout=-1;let{active}=this;if(active.length){let{tooltip}=this;let inTooltip=tooltip&&tooltip.dom.contains(event.relatedTarget);if(!inTooltip)this.view.dispatch({effects:this.setHover.of([])});else this.watchTooltipLeave(tooltip.dom);}}watchTooltipLeave(tooltip){let watch=event=>{tooltip.removeEventListener("mouseleave",watch);if(this.active.length&&!this.view.dom.contains(event.relatedTarget))this.view.dispatch({effects:this.setHover.of([])});};tooltip.addEventListener("mouseleave",watch);}destroy(){clearTimeout(this.hoverTimeout);this.view.dom.removeEventListener("mouseleave",this.mouseleave);this.view.dom.removeEventListener("mousemove",this.mousemove);}}const tooltipMargin=4;function isInTooltip(tooltip,event){let rect=tooltip.getBoundingClientRect();return event.clientX>=rect.left-tooltipMargin&&event.clientX<=rect.right+tooltipMargin&&event.clientY>=rect.top-tooltipMargin&&event.clientY<=rect.bottom+tooltipMargin;}function isOverRange(view,from,to,x,y,margin){let rect=view.scrollDOM.getBoundingClientRect();let docBottom=view.documentTop+view.documentPadding.top+view.contentHeight;if(rect.left>x||rect.right<x||rect.top>y||Math.min(rect.bottom,docBottom)<y)return false;let pos=view.posAtCoords({x,y},false);return pos>=from&&pos<=to;}/**
  Set up a hover tooltip, which shows up when the pointer hovers
  over ranges of text. The callback is called when the mouse hovers
  over the document text. It should, if there is a tooltip
  associated with position `pos`, return the tooltip description
  (either directly or in a promise). The `side` argument indicates
  on which side of the position the pointer is—it will be -1 if the
  pointer is before the position, 1 if after the position.

  Note that all hover tooltips are hosted within a single tooltip
  container element. This allows multiple tooltips over the same
  range to be "merged" together without overlapping.
  */function hoverTooltip(source,options={}){let setHover=StateEffect.define();let hoverState=StateField.define({create(){return[];},update(value,tr){if(value.length){if(options.hideOnChange&&(tr.docChanged||tr.selection))value=[];else if(options.hideOn)value=value.filter(v=>!options.hideOn(tr,v));if(tr.docChanged){let mapped=[];for(let tooltip of value){let newPos=tr.changes.mapPos(tooltip.pos,-1,MapMode.TrackDel);if(newPos!=null){let copy=Object.assign(Object.create(null),tooltip);copy.pos=newPos;if(copy.end!=null)copy.end=tr.changes.mapPos(copy.end);mapped.push(copy);}}value=mapped;}}for(let effect of tr.effects){if(effect.is(setHover))value=effect.value;if(effect.is(closeHoverTooltipEffect))value=[];}return value;},provide:f=>showHoverTooltip.from(f)});return[hoverState,ViewPlugin.define(view=>new HoverPlugin(view,source,hoverState,setHover,options.hoverTime||300/* Hover.Time */)),showHoverTooltipHost];}/**
  Get the active tooltip view for a given tooltip, if available.
  */function getTooltip(view,tooltip){let plugin=view.plugin(tooltipPlugin);if(!plugin)return null;let found=plugin.manager.tooltips.indexOf(tooltip);return found<0?null:plugin.manager.tooltipViews[found];}const closeHoverTooltipEffect=/*@__PURE__*/StateEffect.define();const panelConfig=/*@__PURE__*/Facet.define({combine(configs){let topContainer,bottomContainer;for(let c of configs){topContainer=topContainer||c.topContainer;bottomContainer=bottomContainer||c.bottomContainer;}return{topContainer,bottomContainer};}});/**
  Get the active panel created by the given constructor, if any.
  This can be useful when you need access to your panels' DOM
  structure.
  */function getPanel(view,panel){let plugin=view.plugin(panelPlugin);let index=plugin?plugin.specs.indexOf(panel):-1;return index>-1?plugin.panels[index]:null;}const panelPlugin=/*@__PURE__*/ViewPlugin.fromClass(class{constructor(view){this.input=view.state.facet(showPanel);this.specs=this.input.filter(s=>s);this.panels=this.specs.map(spec=>spec(view));let conf=view.state.facet(panelConfig);this.top=new PanelGroup(view,true,conf.topContainer);this.bottom=new PanelGroup(view,false,conf.bottomContainer);this.top.sync(this.panels.filter(p=>p.top));this.bottom.sync(this.panels.filter(p=>!p.top));for(let p of this.panels){p.dom.classList.add("cm-panel");if(p.mount)p.mount();}}update(update){let conf=update.state.facet(panelConfig);if(this.top.container!=conf.topContainer){this.top.sync([]);this.top=new PanelGroup(update.view,true,conf.topContainer);}if(this.bottom.container!=conf.bottomContainer){this.bottom.sync([]);this.bottom=new PanelGroup(update.view,false,conf.bottomContainer);}this.top.syncClasses();this.bottom.syncClasses();let input=update.state.facet(showPanel);if(input!=this.input){let specs=input.filter(x=>x);let panels=[],top=[],bottom=[],mount=[];for(let spec of specs){let known=this.specs.indexOf(spec),panel;if(known<0){panel=spec(update.view);mount.push(panel);}else{panel=this.panels[known];if(panel.update)panel.update(update);}panels.push(panel);(panel.top?top:bottom).push(panel);}this.specs=specs;this.panels=panels;this.top.sync(top);this.bottom.sync(bottom);for(let p of mount){p.dom.classList.add("cm-panel");if(p.mount)p.mount();}}else{for(let p of this.panels)if(p.update)p.update(update);}}destroy(){this.top.sync([]);this.bottom.sync([]);}},{provide:plugin=>EditorView.scrollMargins.of(view=>{let value=view.plugin(plugin);return value&&{top:value.top.scrollMargin(),bottom:value.bottom.scrollMargin()};})});class PanelGroup{constructor(view,top,container){this.view=view;this.top=top;this.container=container;this.dom=undefined;this.classes="";this.panels=[];this.syncClasses();}sync(panels){for(let p of this.panels)if(p.destroy&&panels.indexOf(p)<0)p.destroy();this.panels=panels;this.syncDOM();}syncDOM(){if(this.panels.length==0){if(this.dom){this.dom.remove();this.dom=undefined;}return;}if(!this.dom){this.dom=document.createElement("div");this.dom.className=this.top?"cm-panels cm-panels-top":"cm-panels cm-panels-bottom";this.dom.style[this.top?"top":"bottom"]="0";let parent=this.container||this.view.dom;parent.insertBefore(this.dom,this.top?parent.firstChild:null);}let curDOM=this.dom.firstChild;for(let panel of this.panels){if(panel.dom.parentNode==this.dom){while(curDOM!=panel.dom)curDOM=rm(curDOM);curDOM=curDOM.nextSibling;}else{this.dom.insertBefore(panel.dom,curDOM);}}while(curDOM)curDOM=rm(curDOM);}scrollMargin(){return!this.dom||this.container?0:Math.max(0,this.top?this.dom.getBoundingClientRect().bottom-Math.max(0,this.view.scrollDOM.getBoundingClientRect().top):Math.min(innerHeight,this.view.scrollDOM.getBoundingClientRect().bottom)-this.dom.getBoundingClientRect().top);}syncClasses(){if(!this.container||this.classes==this.view.themeClasses)return;for(let cls of this.classes.split(" "))if(cls)this.container.classList.remove(cls);for(let cls of(this.classes=this.view.themeClasses).split(" "))if(cls)this.container.classList.add(cls);}}function rm(node){let next=node.nextSibling;node.remove();return next;}/**
  Opening a panel is done by providing a constructor function for
  the panel through this facet. (The panel is closed again when its
  constructor is no longer provided.) Values of `null` are ignored.
  */const showPanel=/*@__PURE__*/Facet.define({enables:panelPlugin});/**
  A gutter marker represents a bit of information attached to a line
  in a specific gutter. Your own custom markers have to extend this
  class.
  */class GutterMarker extends RangeValue{/**
      @internal
      */compare(other){return this==other||this.constructor==other.constructor&&this.eq(other);}/**
      Compare this marker to another marker of the same type.
      */eq(other){return false;}/**
      Called if the marker has a `toDOM` method and its representation
      was removed from a gutter.
      */destroy(dom){}}GutterMarker.prototype.elementClass="";GutterMarker.prototype.toDOM=undefined;GutterMarker.prototype.mapMode=MapMode.TrackBefore;GutterMarker.prototype.startSide=GutterMarker.prototype.endSide=-1;GutterMarker.prototype.point=true;/**
  Facet used to add a class to all gutter elements for a given line.
  Markers given to this facet should _only_ define an
  [`elementclass`](https://codemirror.net/6/docs/ref/#view.GutterMarker.elementClass), not a
  [`toDOM`](https://codemirror.net/6/docs/ref/#view.GutterMarker.toDOM) (or the marker will appear
  in all gutters for the line).
  */const gutterLineClass=/*@__PURE__*/Facet.define();const defaults$1={class:"",renderEmptyElements:false,elementStyle:"",markers:()=>RangeSet.empty,lineMarker:()=>null,widgetMarker:()=>null,lineMarkerChange:null,initialSpacer:null,updateSpacer:null,domEventHandlers:{}};const activeGutters=/*@__PURE__*/Facet.define();/**
  Define an editor gutter. The order in which the gutters appear is
  determined by their extension priority.
  */function gutter(config){return[gutters(),activeGutters.of(Object.assign(Object.assign({},defaults$1),config))];}const unfixGutters=/*@__PURE__*/Facet.define({combine:values=>values.some(x=>x)});/**
  The gutter-drawing plugin is automatically enabled when you add a
  gutter, but you can use this function to explicitly configure it.

  Unless `fixed` is explicitly set to `false`, the gutters are
  fixed, meaning they don't scroll along with the content
  horizontally (except on Internet Explorer, which doesn't support
  CSS [`position:
  sticky`](https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky)).
  */function gutters(config){let result=[gutterView];return result;}const gutterView=/*@__PURE__*/ViewPlugin.fromClass(class{constructor(view){this.view=view;this.prevViewport=view.viewport;this.dom=document.createElement("div");this.dom.className="cm-gutters";this.dom.setAttribute("aria-hidden","true");this.dom.style.minHeight=this.view.contentHeight/this.view.scaleY+"px";this.gutters=view.state.facet(activeGutters).map(conf=>new SingleGutterView(view,conf));for(let gutter of this.gutters)this.dom.appendChild(gutter.dom);this.fixed=!view.state.facet(unfixGutters);if(this.fixed){// FIXME IE11 fallback, which doesn't support position: sticky,
// by using position: relative + event handlers that realign the
// gutter (or just force fixed=false on IE11?)
this.dom.style.position="sticky";}this.syncGutters(false);view.scrollDOM.insertBefore(this.dom,view.contentDOM);}update(update){if(this.updateGutters(update)){// Detach during sync when the viewport changed significantly
// (such as during scrolling), since for large updates that is
// faster.
let vpA=this.prevViewport,vpB=update.view.viewport;let vpOverlap=Math.min(vpA.to,vpB.to)-Math.max(vpA.from,vpB.from);this.syncGutters(vpOverlap<(vpB.to-vpB.from)*0.8);}if(update.geometryChanged){this.dom.style.minHeight=this.view.contentHeight/this.view.scaleY+"px";}if(this.view.state.facet(unfixGutters)!=!this.fixed){this.fixed=!this.fixed;this.dom.style.position=this.fixed?"sticky":"";}this.prevViewport=update.view.viewport;}syncGutters(detach){let after=this.dom.nextSibling;if(detach)this.dom.remove();let lineClasses=RangeSet.iter(this.view.state.facet(gutterLineClass),this.view.viewport.from);let classSet=[];let contexts=this.gutters.map(gutter=>new UpdateContext(gutter,this.view.viewport,-this.view.documentPadding.top));for(let line of this.view.viewportLineBlocks){if(classSet.length)classSet=[];if(Array.isArray(line.type)){let first=true;for(let b of line.type){if(b.type==BlockType.Text&&first){advanceCursor(lineClasses,classSet,b.from);for(let cx of contexts)cx.line(this.view,b,classSet);first=false;}else if(b.widget){for(let cx of contexts)cx.widget(this.view,b);}}}else if(line.type==BlockType.Text){advanceCursor(lineClasses,classSet,line.from);for(let cx of contexts)cx.line(this.view,line,classSet);}else if(line.widget){for(let cx of contexts)cx.widget(this.view,line);}}for(let cx of contexts)cx.finish();if(detach)this.view.scrollDOM.insertBefore(this.dom,after);}updateGutters(update){let prev=update.startState.facet(activeGutters),cur=update.state.facet(activeGutters);let change=update.docChanged||update.heightChanged||update.viewportChanged||!RangeSet.eq(update.startState.facet(gutterLineClass),update.state.facet(gutterLineClass),update.view.viewport.from,update.view.viewport.to);if(prev==cur){for(let gutter of this.gutters)if(gutter.update(update))change=true;}else{change=true;let gutters=[];for(let conf of cur){let known=prev.indexOf(conf);if(known<0){gutters.push(new SingleGutterView(this.view,conf));}else{this.gutters[known].update(update);gutters.push(this.gutters[known]);}}for(let g of this.gutters){g.dom.remove();if(gutters.indexOf(g)<0)g.destroy();}for(let g of gutters)this.dom.appendChild(g.dom);this.gutters=gutters;}return change;}destroy(){for(let view of this.gutters)view.destroy();this.dom.remove();}},{provide:plugin=>EditorView.scrollMargins.of(view=>{let value=view.plugin(plugin);if(!value||value.gutters.length==0||!value.fixed)return null;return view.textDirection==Direction.LTR?{left:value.dom.offsetWidth*view.scaleX}:{right:value.dom.offsetWidth*view.scaleX};})});function asArray(val){return Array.isArray(val)?val:[val];}function advanceCursor(cursor,collect,pos){while(cursor.value&&cursor.from<=pos){if(cursor.from==pos)collect.push(cursor.value);cursor.next();}}class UpdateContext{constructor(gutter,viewport,height){this.gutter=gutter;this.height=height;this.i=0;this.cursor=RangeSet.iter(gutter.markers,viewport.from);}addElement(view,block,markers){let{gutter}=this,above=(block.top-this.height)/view.scaleY,height=block.height/view.scaleY;if(this.i==gutter.elements.length){let newElt=new GutterElement(view,height,above,markers);gutter.elements.push(newElt);gutter.dom.appendChild(newElt.dom);}else{gutter.elements[this.i].update(view,height,above,markers);}this.height=block.bottom;this.i++;}line(view,line,extraMarkers){let localMarkers=[];advanceCursor(this.cursor,localMarkers,line.from);if(extraMarkers.length)localMarkers=localMarkers.concat(extraMarkers);let forLine=this.gutter.config.lineMarker(view,line,localMarkers);if(forLine)localMarkers.unshift(forLine);let gutter=this.gutter;if(localMarkers.length==0&&!gutter.config.renderEmptyElements)return;this.addElement(view,line,localMarkers);}widget(view,block){let marker=this.gutter.config.widgetMarker(view,block.widget,block);if(marker)this.addElement(view,block,[marker]);}finish(){let gutter=this.gutter;while(gutter.elements.length>this.i){let last=gutter.elements.pop();gutter.dom.removeChild(last.dom);last.destroy();}}}class SingleGutterView{constructor(view,config){this.view=view;this.config=config;this.elements=[];this.spacer=null;this.dom=document.createElement("div");this.dom.className="cm-gutter"+(this.config.class?" "+this.config.class:"");for(let prop in config.domEventHandlers){this.dom.addEventListener(prop,event=>{let target=event.target,y;if(target!=this.dom&&this.dom.contains(target)){while(target.parentNode!=this.dom)target=target.parentNode;let rect=target.getBoundingClientRect();y=(rect.top+rect.bottom)/2;}else{y=event.clientY;}let line=view.lineBlockAtHeight(y-view.documentTop);if(config.domEventHandlers[prop](view,line,event))event.preventDefault();});}this.markers=asArray(config.markers(view));if(config.initialSpacer){this.spacer=new GutterElement(view,0,0,[config.initialSpacer(view)]);this.dom.appendChild(this.spacer.dom);this.spacer.dom.style.cssText+="visibility: hidden; pointer-events: none";}}update(update){let prevMarkers=this.markers;this.markers=asArray(this.config.markers(update.view));if(this.spacer&&this.config.updateSpacer){let updated=this.config.updateSpacer(this.spacer.markers[0],update);if(updated!=this.spacer.markers[0])this.spacer.update(update.view,0,0,[updated]);}let vp=update.view.viewport;return!RangeSet.eq(this.markers,prevMarkers,vp.from,vp.to)||(this.config.lineMarkerChange?this.config.lineMarkerChange(update):false);}destroy(){for(let elt of this.elements)elt.destroy();}}class GutterElement{constructor(view,height,above,markers){this.height=-1;this.above=0;this.markers=[];this.dom=document.createElement("div");this.dom.className="cm-gutterElement";this.update(view,height,above,markers);}update(view,height,above,markers){if(this.height!=height){this.height=height;this.dom.style.height=height+"px";}if(this.above!=above)this.dom.style.marginTop=(this.above=above)?above+"px":"";if(!sameMarkers(this.markers,markers))this.setMarkers(view,markers);}setMarkers(view,markers){let cls="cm-gutterElement",domPos=this.dom.firstChild;for(let iNew=0,iOld=0;;){let skipTo=iOld,marker=iNew<markers.length?markers[iNew++]:null,matched=false;if(marker){let c=marker.elementClass;if(c)cls+=" "+c;for(let i=iOld;i<this.markers.length;i++)if(this.markers[i].compare(marker)){skipTo=i;matched=true;break;}}else{skipTo=this.markers.length;}while(iOld<skipTo){let next=this.markers[iOld++];if(next.toDOM){next.destroy(domPos);let after=domPos.nextSibling;domPos.remove();domPos=after;}}if(!marker)break;if(marker.toDOM){if(matched)domPos=domPos.nextSibling;else this.dom.insertBefore(marker.toDOM(view),domPos);}if(matched)iOld++;}this.dom.className=cls;this.markers=markers;}destroy(){this.setMarkers(null,[]);// First argument not used unless creating markers
}}function sameMarkers(a,b){if(a.length!=b.length)return false;for(let i=0;i<a.length;i++)if(!a[i].compare(b[i]))return false;return true;}/**
  Facet used to provide markers to the line number gutter.
  */const lineNumberMarkers=/*@__PURE__*/Facet.define();const lineNumberConfig=/*@__PURE__*/Facet.define({combine(values){return combineConfig(values,{formatNumber:String,domEventHandlers:{}},{domEventHandlers(a,b){let result=Object.assign({},a);for(let event in b){let exists=result[event],add=b[event];result[event]=exists?(view,line,event)=>exists(view,line,event)||add(view,line,event):add;}return result;}});}});class NumberMarker extends GutterMarker{constructor(number){super();this.number=number;}eq(other){return this.number==other.number;}toDOM(){return document.createTextNode(this.number);}}function formatNumber(view,number){return view.state.facet(lineNumberConfig).formatNumber(number,view.state);}const lineNumberGutter=/*@__PURE__*/activeGutters.compute([lineNumberConfig],state=>({class:"cm-lineNumbers",renderEmptyElements:false,markers(view){return view.state.facet(lineNumberMarkers);},lineMarker(view,line,others){if(others.some(m=>m.toDOM))return null;return new NumberMarker(formatNumber(view,view.state.doc.lineAt(line.from).number));},widgetMarker:()=>null,lineMarkerChange:update=>update.startState.facet(lineNumberConfig)!=update.state.facet(lineNumberConfig),initialSpacer(view){return new NumberMarker(formatNumber(view,maxLineNumber(view.state.doc.lines)));},updateSpacer(spacer,update){let max=formatNumber(update.view,maxLineNumber(update.view.state.doc.lines));return max==spacer.number?spacer:new NumberMarker(max);},domEventHandlers:state.facet(lineNumberConfig).domEventHandlers}));/**
  Create a line number gutter extension.
  */function lineNumbers(config={}){return[lineNumberConfig.of(config),gutters(),lineNumberGutter];}function maxLineNumber(lines){let last=9;while(last<lines)last=last*10+9;return last;}const activeLineGutterMarker=/*@__PURE__*/new class extends GutterMarker{constructor(){super(...arguments);this.elementClass="cm-activeLineGutter";}}();const activeLineGutterHighlighter=/*@__PURE__*/gutterLineClass.compute(["selection"],state=>{let marks=[],last=-1;for(let range of state.selection.ranges){let linePos=state.doc.lineAt(range.head).from;if(linePos>last){last=linePos;marks.push(activeLineGutterMarker.range(linePos));}}return RangeSet.of(marks);});/**
  Returns an extension that adds a `cm-activeLineGutter` class to
  all gutter elements on the [active
  line](https://codemirror.net/6/docs/ref/#view.highlightActiveLine).
  */function highlightActiveLineGutter(){return activeLineGutterHighlighter;}/**
  The default maximum length of a `TreeBuffer` node.
  */const DefaultBufferLength=1024;let nextPropID=0;class Range{constructor(from,to){this.from=from;this.to=to;}}/**
  Each [node type](#common.NodeType) or [individual tree](#common.Tree)
  can have metadata associated with it in props. Instances of this
  class represent prop names.
  */class NodeProp{/**
      Create a new node prop type.
      */constructor(config={}){this.id=nextPropID++;this.perNode=!!config.perNode;this.deserialize=config.deserialize||(()=>{throw new Error("This node type doesn't define a deserialize function");});}/**
      This is meant to be used with
      [`NodeSet.extend`](#common.NodeSet.extend) or
      [`LRParser.configure`](#lr.ParserConfig.props) to compute
      prop values for each node type in the set. Takes a [match
      object](#common.NodeType^match) or function that returns undefined
      if the node type doesn't get this prop, and the prop's value if
      it does.
      */add(match){if(this.perNode)throw new RangeError("Can't add per-node props to node types");if(typeof match!="function")match=NodeType.match(match);return type=>{let result=match(type);return result===undefined?null:[this,result];};}}/**
  Prop that is used to describe matching delimiters. For opening
  delimiters, this holds an array of node names (written as a
  space-separated string when declaring this prop in a grammar)
  for the node types of closing delimiters that match it.
  */NodeProp.closedBy=new NodeProp({deserialize:str=>str.split(" ")});/**
  The inverse of [`closedBy`](#common.NodeProp^closedBy). This is
  attached to closing delimiters, holding an array of node names
  of types of matching opening delimiters.
  */NodeProp.openedBy=new NodeProp({deserialize:str=>str.split(" ")});/**
  Used to assign node types to groups (for example, all node
  types that represent an expression could be tagged with an
  `"Expression"` group).
  */NodeProp.group=new NodeProp({deserialize:str=>str.split(" ")});/**
  Attached to nodes to indicate these should be
  [displayed](https://codemirror.net/docs/ref/#language.syntaxTree)
  in a bidirectional text isolate, so that direction-neutral
  characters on their sides don't incorrectly get associated with
  surrounding text. You'll generally want to set this for nodes
  that contain arbitrary text, like strings and comments, and for
  nodes that appear _inside_ arbitrary text, like HTML tags. When
  not given a value, in a grammar declaration, defaults to
  `"auto"`.
  */NodeProp.isolate=new NodeProp({deserialize:value=>{if(value&&value!="rtl"&&value!="ltr"&&value!="auto")throw new RangeError("Invalid value for isolate: "+value);return value||"auto";}});/**
  The hash of the [context](#lr.ContextTracker.constructor)
  that the node was parsed in, if any. Used to limit reuse of
  contextual nodes.
  */NodeProp.contextHash=new NodeProp({perNode:true});/**
  The distance beyond the end of the node that the tokenizer
  looked ahead for any of the tokens inside the node. (The LR
  parser only stores this when it is larger than 25, for
  efficiency reasons.)
  */NodeProp.lookAhead=new NodeProp({perNode:true});/**
  This per-node prop is used to replace a given node, or part of a
  node, with another tree. This is useful to include trees from
  different languages in mixed-language parsers.
  */NodeProp.mounted=new NodeProp({perNode:true});/**
  A mounted tree, which can be [stored](#common.NodeProp^mounted) on
  a tree node to indicate that parts of its content are
  represented by another tree.
  */class MountedTree{constructor(/**
      The inner tree.
      */tree,/**
      If this is null, this tree replaces the entire node (it will
      be included in the regular iteration instead of its host
      node). If not, only the given ranges are considered to be
      covered by this tree. This is used for trees that are mixed in
      a way that isn't strictly hierarchical. Such mounted trees are
      only entered by [`resolveInner`](#common.Tree.resolveInner)
      and [`enter`](#common.SyntaxNode.enter).
      */overlay,/**
      The parser used to create this subtree.
      */parser){this.tree=tree;this.overlay=overlay;this.parser=parser;}/**
      @internal
      */static get(tree){return tree&&tree.props&&tree.props[NodeProp.mounted.id];}}const noProps=Object.create(null);/**
  Each node in a syntax tree has a node type associated with it.
  */class NodeType{/**
      @internal
      */constructor(/**
      The name of the node type. Not necessarily unique, but if the
      grammar was written properly, different node types with the
      same name within a node set should play the same semantic
      role.
      */name,/**
      @internal
      */props,/**
      The id of this node in its set. Corresponds to the term ids
      used in the parser.
      */id,/**
      @internal
      */flags=0){this.name=name;this.props=props;this.id=id;this.flags=flags;}/**
      Define a node type.
      */static define(spec){let props=spec.props&&spec.props.length?Object.create(null):noProps;let flags=(spec.top?1/* NodeFlag.Top */:0)|(spec.skipped?2/* NodeFlag.Skipped */:0)|(spec.error?4/* NodeFlag.Error */:0)|(spec.name==null?8/* NodeFlag.Anonymous */:0);let type=new NodeType(spec.name||"",props,spec.id,flags);if(spec.props)for(let src of spec.props){if(!Array.isArray(src))src=src(type);if(src){if(src[0].perNode)throw new RangeError("Can't store a per-node prop on a node type");props[src[0].id]=src[1];}}return type;}/**
      Retrieves a node prop for this type. Will return `undefined` if
      the prop isn't present on this node.
      */prop(prop){return this.props[prop.id];}/**
      True when this is the top node of a grammar.
      */get isTop(){return(this.flags&1/* NodeFlag.Top */)>0;}/**
      True when this node is produced by a skip rule.
      */get isSkipped(){return(this.flags&2/* NodeFlag.Skipped */)>0;}/**
      Indicates whether this is an error node.
      */get isError(){return(this.flags&4/* NodeFlag.Error */)>0;}/**
      When true, this node type doesn't correspond to a user-declared
      named node, for example because it is used to cache repetition.
      */get isAnonymous(){return(this.flags&8/* NodeFlag.Anonymous */)>0;}/**
      Returns true when this node's name or one of its
      [groups](#common.NodeProp^group) matches the given string.
      */is(name){if(typeof name=='string'){if(this.name==name)return true;let group=this.prop(NodeProp.group);return group?group.indexOf(name)>-1:false;}return this.id==name;}/**
      Create a function from node types to arbitrary values by
      specifying an object whose property names are node or
      [group](#common.NodeProp^group) names. Often useful with
      [`NodeProp.add`](#common.NodeProp.add). You can put multiple
      names, separated by spaces, in a single property name to map
      multiple node names to a single value.
      */static match(map){let direct=Object.create(null);for(let prop in map)for(let name of prop.split(" "))direct[name]=map[prop];return node=>{for(let groups=node.prop(NodeProp.group),i=-1;i<(groups?groups.length:0);i++){let found=direct[i<0?node.name:groups[i]];if(found)return found;}};}}/**
  An empty dummy node type to use when no actual type is available.
  */NodeType.none=new NodeType("",Object.create(null),0,8/* NodeFlag.Anonymous */);/**
  A node set holds a collection of node types. It is used to
  compactly represent trees by storing their type ids, rather than a
  full pointer to the type object, in a numeric array. Each parser
  [has](#lr.LRParser.nodeSet) a node set, and [tree
  buffers](#common.TreeBuffer) can only store collections of nodes
  from the same set. A set can have a maximum of 2**16 (65536) node
  types in it, so that the ids fit into 16-bit typed array slots.
  */class NodeSet{/**
      Create a set with the given types. The `id` property of each
      type should correspond to its position within the array.
      */constructor(/**
      The node types in this set, by id.
      */types){this.types=types;for(let i=0;i<types.length;i++)if(types[i].id!=i)throw new RangeError("Node type ids should correspond to array positions when creating a node set");}/**
      Create a copy of this set with some node properties added. The
      arguments to this method can be created with
      [`NodeProp.add`](#common.NodeProp.add).
      */extend(...props){let newTypes=[];for(let type of this.types){let newProps=null;for(let source of props){let add=source(type);if(add){if(!newProps)newProps=Object.assign({},type.props);newProps[add[0].id]=add[1];}}newTypes.push(newProps?new NodeType(type.name,newProps,type.id,type.flags):type);}return new NodeSet(newTypes);}}const CachedNode=new WeakMap(),CachedInnerNode=new WeakMap();/**
  Options that control iteration. Can be combined with the `|`
  operator to enable multiple ones.
  */var IterMode;(function(IterMode){/**
      When enabled, iteration will only visit [`Tree`](#common.Tree)
      objects, not nodes packed into
      [`TreeBuffer`](#common.TreeBuffer)s.
      */IterMode[IterMode["ExcludeBuffers"]=1]="ExcludeBuffers";/**
      Enable this to make iteration include anonymous nodes (such as
      the nodes that wrap repeated grammar constructs into a balanced
      tree).
      */IterMode[IterMode["IncludeAnonymous"]=2]="IncludeAnonymous";/**
      By default, regular [mounted](#common.NodeProp^mounted) nodes
      replace their base node in iteration. Enable this to ignore them
      instead.
      */IterMode[IterMode["IgnoreMounts"]=4]="IgnoreMounts";/**
      This option only applies in
      [`enter`](#common.SyntaxNode.enter)-style methods. It tells the
      library to not enter mounted overlays if one covers the given
      position.
      */IterMode[IterMode["IgnoreOverlays"]=8]="IgnoreOverlays";})(IterMode||(IterMode={}));/**
  A piece of syntax tree. There are two ways to approach these
  trees: the way they are actually stored in memory, and the
  convenient way.

  Syntax trees are stored as a tree of `Tree` and `TreeBuffer`
  objects. By packing detail information into `TreeBuffer` leaf
  nodes, the representation is made a lot more memory-efficient.

  However, when you want to actually work with tree nodes, this
  representation is very awkward, so most client code will want to
  use the [`TreeCursor`](#common.TreeCursor) or
  [`SyntaxNode`](#common.SyntaxNode) interface instead, which provides
  a view on some part of this data structure, and can be used to
  move around to adjacent nodes.
  */class Tree{/**
      Construct a new tree. See also [`Tree.build`](#common.Tree^build).
      */constructor(/**
      The type of the top node.
      */type,/**
      This node's child nodes.
      */children,/**
      The positions (offsets relative to the start of this tree) of
      the children.
      */positions,/**
      The total length of this tree
      */length,/**
      Per-node [node props](#common.NodeProp) to associate with this node.
      */props){this.type=type;this.children=children;this.positions=positions;this.length=length;/**
          @internal
          */this.props=null;if(props&&props.length){this.props=Object.create(null);for(let[prop,value]of props)this.props[typeof prop=="number"?prop:prop.id]=value;}}/**
      @internal
      */toString(){let mounted=MountedTree.get(this);if(mounted&&!mounted.overlay)return mounted.tree.toString();let children="";for(let ch of this.children){let str=ch.toString();if(str){if(children)children+=",";children+=str;}}return!this.type.name?children:(/\W/.test(this.type.name)&&!this.type.isError?JSON.stringify(this.type.name):this.type.name)+(children.length?"("+children+")":"");}/**
      Get a [tree cursor](#common.TreeCursor) positioned at the top of
      the tree. Mode can be used to [control](#common.IterMode) which
      nodes the cursor visits.
      */cursor(mode=0){return new TreeCursor(this.topNode,mode);}/**
      Get a [tree cursor](#common.TreeCursor) pointing into this tree
      at the given position and side (see
      [`moveTo`](#common.TreeCursor.moveTo).
      */cursorAt(pos,side=0,mode=0){let scope=CachedNode.get(this)||this.topNode;let cursor=new TreeCursor(scope);cursor.moveTo(pos,side);CachedNode.set(this,cursor._tree);return cursor;}/**
      Get a [syntax node](#common.SyntaxNode) object for the top of the
      tree.
      */get topNode(){return new TreeNode(this,0,0,null);}/**
      Get the [syntax node](#common.SyntaxNode) at the given position.
      If `side` is -1, this will move into nodes that end at the
      position. If 1, it'll move into nodes that start at the
      position. With 0, it'll only enter nodes that cover the position
      from both sides.
      
      Note that this will not enter
      [overlays](#common.MountedTree.overlay), and you often want
      [`resolveInner`](#common.Tree.resolveInner) instead.
      */resolve(pos,side=0){let node=resolveNode(CachedNode.get(this)||this.topNode,pos,side,false);CachedNode.set(this,node);return node;}/**
      Like [`resolve`](#common.Tree.resolve), but will enter
      [overlaid](#common.MountedTree.overlay) nodes, producing a syntax node
      pointing into the innermost overlaid tree at the given position
      (with parent links going through all parent structure, including
      the host trees).
      */resolveInner(pos,side=0){let node=resolveNode(CachedInnerNode.get(this)||this.topNode,pos,side,true);CachedInnerNode.set(this,node);return node;}/**
      In some situations, it can be useful to iterate through all
      nodes around a position, including those in overlays that don't
      directly cover the position. This method gives you an iterator
      that will produce all nodes, from small to big, around the given
      position.
      */resolveStack(pos,side=0){return stackIterator(this,pos,side);}/**
      Iterate over the tree and its children, calling `enter` for any
      node that touches the `from`/`to` region (if given) before
      running over such a node's children, and `leave` (if given) when
      leaving the node. When `enter` returns `false`, that node will
      not have its children iterated over (or `leave` called).
      */iterate(spec){let{enter,leave,from=0,to=this.length}=spec;let mode=spec.mode||0,anon=(mode&IterMode.IncludeAnonymous)>0;for(let c=this.cursor(mode|IterMode.IncludeAnonymous);;){let entered=false;if(c.from<=to&&c.to>=from&&(!anon&&c.type.isAnonymous||enter(c)!==false)){if(c.firstChild())continue;entered=true;}for(;;){if(entered&&leave&&(anon||!c.type.isAnonymous))leave(c);if(c.nextSibling())break;if(!c.parent())return;entered=true;}}}/**
      Get the value of the given [node prop](#common.NodeProp) for this
      node. Works with both per-node and per-type props.
      */prop(prop){return!prop.perNode?this.type.prop(prop):this.props?this.props[prop.id]:undefined;}/**
      Returns the node's [per-node props](#common.NodeProp.perNode) in a
      format that can be passed to the [`Tree`](#common.Tree)
      constructor.
      */get propValues(){let result=[];if(this.props)for(let id in this.props)result.push([+id,this.props[id]]);return result;}/**
      Balance the direct children of this tree, producing a copy of
      which may have children grouped into subtrees with type
      [`NodeType.none`](#common.NodeType^none).
      */balance(config={}){return this.children.length<=8/* Balance.BranchFactor */?this:balanceRange(NodeType.none,this.children,this.positions,0,this.children.length,0,this.length,(children,positions,length)=>new Tree(this.type,children,positions,length,this.propValues),config.makeTree||((children,positions,length)=>new Tree(NodeType.none,children,positions,length)));}/**
      Build a tree from a postfix-ordered buffer of node information,
      or a cursor over such a buffer.
      */static build(data){return buildTree(data);}}/**
  The empty tree
  */Tree.empty=new Tree(NodeType.none,[],[],0);class FlatBufferCursor{constructor(buffer,index){this.buffer=buffer;this.index=index;}get id(){return this.buffer[this.index-4];}get start(){return this.buffer[this.index-3];}get end(){return this.buffer[this.index-2];}get size(){return this.buffer[this.index-1];}get pos(){return this.index;}next(){this.index-=4;}fork(){return new FlatBufferCursor(this.buffer,this.index);}}/**
  Tree buffers contain (type, start, end, endIndex) quads for each
  node. In such a buffer, nodes are stored in prefix order (parents
  before children, with the endIndex of the parent indicating which
  children belong to it).
  */class TreeBuffer{/**
      Create a tree buffer.
      */constructor(/**
      The buffer's content.
      */buffer,/**
      The total length of the group of nodes in the buffer.
      */length,/**
      The node set used in this buffer.
      */set){this.buffer=buffer;this.length=length;this.set=set;}/**
      @internal
      */get type(){return NodeType.none;}/**
      @internal
      */toString(){let result=[];for(let index=0;index<this.buffer.length;){result.push(this.childString(index));index=this.buffer[index+3];}return result.join(",");}/**
      @internal
      */childString(index){let id=this.buffer[index],endIndex=this.buffer[index+3];let type=this.set.types[id],result=type.name;if(/\W/.test(result)&&!type.isError)result=JSON.stringify(result);index+=4;if(endIndex==index)return result;let children=[];while(index<endIndex){children.push(this.childString(index));index=this.buffer[index+3];}return result+"("+children.join(",")+")";}/**
      @internal
      */findChild(startIndex,endIndex,dir,pos,side){let{buffer}=this,pick=-1;for(let i=startIndex;i!=endIndex;i=buffer[i+3]){if(checkSide(side,pos,buffer[i+1],buffer[i+2])){pick=i;if(dir>0)break;}}return pick;}/**
      @internal
      */slice(startI,endI,from){let b=this.buffer;let copy=new Uint16Array(endI-startI),len=0;for(let i=startI,j=0;i<endI;){copy[j++]=b[i++];copy[j++]=b[i++]-from;let to=copy[j++]=b[i++]-from;copy[j++]=b[i++]-startI;len=Math.max(len,to);}return new TreeBuffer(copy,len,this.set);}}function checkSide(side,pos,from,to){switch(side){case-2/* Side.Before */:return from<pos;case-1/* Side.AtOrBefore */:return to>=pos&&from<pos;case 0/* Side.Around */:return from<pos&&to>pos;case 1/* Side.AtOrAfter */:return from<=pos&&to>pos;case 2/* Side.After */:return to>pos;case 4/* Side.DontCare */:return true;}}function resolveNode(node,pos,side,overlays){var _a;// Move up to a node that actually holds the position, if possible
while(node.from==node.to||(side<1?node.from>=pos:node.from>pos)||(side>-1?node.to<=pos:node.to<pos)){let parent=!overlays&&node instanceof TreeNode&&node.index<0?null:node.parent;if(!parent)return node;node=parent;}let mode=overlays?0:IterMode.IgnoreOverlays;// Must go up out of overlays when those do not overlap with pos
if(overlays)for(let scan=node,parent=scan.parent;parent;scan=parent,parent=scan.parent){if(scan instanceof TreeNode&&scan.index<0&&((_a=parent.enter(pos,side,mode))===null||_a===void 0?void 0:_a.from)!=scan.from)node=parent;}for(;;){let inner=node.enter(pos,side,mode);if(!inner)return node;node=inner;}}class BaseNode{cursor(mode=0){return new TreeCursor(this,mode);}getChild(type,before=null,after=null){let r=getChildren(this,type,before,after);return r.length?r[0]:null;}getChildren(type,before=null,after=null){return getChildren(this,type,before,after);}resolve(pos,side=0){return resolveNode(this,pos,side,false);}resolveInner(pos,side=0){return resolveNode(this,pos,side,true);}matchContext(context){return matchNodeContext(this.parent,context);}enterUnfinishedNodesBefore(pos){let scan=this.childBefore(pos),node=this;while(scan){let last=scan.lastChild;if(!last||last.to!=scan.to)break;if(last.type.isError&&last.from==last.to){node=scan;scan=last.prevSibling;}else{scan=last;}}return node;}get node(){return this;}get next(){return this.parent;}}class TreeNode extends BaseNode{constructor(_tree,from,// Index in parent node, set to -1 if the node is not a direct child of _parent.node (overlay)
index,_parent){super();this._tree=_tree;this.from=from;this.index=index;this._parent=_parent;}get type(){return this._tree.type;}get name(){return this._tree.type.name;}get to(){return this.from+this._tree.length;}nextChild(i,dir,pos,side,mode=0){for(let parent=this;;){for(let{children,positions}=parent._tree,e=dir>0?children.length:-1;i!=e;i+=dir){let next=children[i],start=positions[i]+parent.from;if(!checkSide(side,pos,start,start+next.length))continue;if(next instanceof TreeBuffer){if(mode&IterMode.ExcludeBuffers)continue;let index=next.findChild(0,next.buffer.length,dir,pos-start,side);if(index>-1)return new BufferNode(new BufferContext(parent,next,i,start),null,index);}else if(mode&IterMode.IncludeAnonymous||!next.type.isAnonymous||hasChild(next)){let mounted;if(!(mode&IterMode.IgnoreMounts)&&(mounted=MountedTree.get(next))&&!mounted.overlay)return new TreeNode(mounted.tree,start,i,parent);let inner=new TreeNode(next,start,i,parent);return mode&IterMode.IncludeAnonymous||!inner.type.isAnonymous?inner:inner.nextChild(dir<0?next.children.length-1:0,dir,pos,side);}}if(mode&IterMode.IncludeAnonymous||!parent.type.isAnonymous)return null;if(parent.index>=0)i=parent.index+dir;else i=dir<0?-1:parent._parent._tree.children.length;parent=parent._parent;if(!parent)return null;}}get firstChild(){return this.nextChild(0,1,0,4/* Side.DontCare */);}get lastChild(){return this.nextChild(this._tree.children.length-1,-1,0,4/* Side.DontCare */);}childAfter(pos){return this.nextChild(0,1,pos,2/* Side.After */);}childBefore(pos){return this.nextChild(this._tree.children.length-1,-1,pos,-2/* Side.Before */);}enter(pos,side,mode=0){let mounted;if(!(mode&IterMode.IgnoreOverlays)&&(mounted=MountedTree.get(this._tree))&&mounted.overlay){let rPos=pos-this.from;for(let{from,to}of mounted.overlay){if((side>0?from<=rPos:from<rPos)&&(side<0?to>=rPos:to>rPos))return new TreeNode(mounted.tree,mounted.overlay[0].from+this.from,-1,this);}}return this.nextChild(0,1,pos,side,mode);}nextSignificantParent(){let val=this;while(val.type.isAnonymous&&val._parent)val=val._parent;return val;}get parent(){return this._parent?this._parent.nextSignificantParent():null;}get nextSibling(){return this._parent&&this.index>=0?this._parent.nextChild(this.index+1,1,0,4/* Side.DontCare */):null;}get prevSibling(){return this._parent&&this.index>=0?this._parent.nextChild(this.index-1,-1,0,4/* Side.DontCare */):null;}get tree(){return this._tree;}toTree(){return this._tree;}/**
      @internal
      */toString(){return this._tree.toString();}}function getChildren(node,type,before,after){let cur=node.cursor(),result=[];if(!cur.firstChild())return result;if(before!=null)for(let found=false;!found;){found=cur.type.is(before);if(!cur.nextSibling())return result;}for(;;){if(after!=null&&cur.type.is(after))return result;if(cur.type.is(type))result.push(cur.node);if(!cur.nextSibling())return after==null?result:[];}}function matchNodeContext(node,context,i=context.length-1){for(let p=node;i>=0;p=p.parent){if(!p)return false;if(!p.type.isAnonymous){if(context[i]&&context[i]!=p.name)return false;i--;}}return true;}class BufferContext{constructor(parent,buffer,index,start){this.parent=parent;this.buffer=buffer;this.index=index;this.start=start;}}class BufferNode extends BaseNode{get name(){return this.type.name;}get from(){return this.context.start+this.context.buffer.buffer[this.index+1];}get to(){return this.context.start+this.context.buffer.buffer[this.index+2];}constructor(context,_parent,index){super();this.context=context;this._parent=_parent;this.index=index;this.type=context.buffer.set.types[context.buffer.buffer[index]];}child(dir,pos,side){let{buffer}=this.context;let index=buffer.findChild(this.index+4,buffer.buffer[this.index+3],dir,pos-this.context.start,side);return index<0?null:new BufferNode(this.context,this,index);}get firstChild(){return this.child(1,0,4/* Side.DontCare */);}get lastChild(){return this.child(-1,0,4/* Side.DontCare */);}childAfter(pos){return this.child(1,pos,2/* Side.After */);}childBefore(pos){return this.child(-1,pos,-2/* Side.Before */);}enter(pos,side,mode=0){if(mode&IterMode.ExcludeBuffers)return null;let{buffer}=this.context;let index=buffer.findChild(this.index+4,buffer.buffer[this.index+3],side>0?1:-1,pos-this.context.start,side);return index<0?null:new BufferNode(this.context,this,index);}get parent(){return this._parent||this.context.parent.nextSignificantParent();}externalSibling(dir){return this._parent?null:this.context.parent.nextChild(this.context.index+dir,dir,0,4/* Side.DontCare */);}get nextSibling(){let{buffer}=this.context;let after=buffer.buffer[this.index+3];if(after<(this._parent?buffer.buffer[this._parent.index+3]:buffer.buffer.length))return new BufferNode(this.context,this._parent,after);return this.externalSibling(1);}get prevSibling(){let{buffer}=this.context;let parentStart=this._parent?this._parent.index+4:0;if(this.index==parentStart)return this.externalSibling(-1);return new BufferNode(this.context,this._parent,buffer.findChild(parentStart,this.index,-1,0,4/* Side.DontCare */));}get tree(){return null;}toTree(){let children=[],positions=[];let{buffer}=this.context;let startI=this.index+4,endI=buffer.buffer[this.index+3];if(endI>startI){let from=buffer.buffer[this.index+1];children.push(buffer.slice(startI,endI,from));positions.push(0);}return new Tree(this.type,children,positions,this.to-this.from);}/**
      @internal
      */toString(){return this.context.buffer.childString(this.index);}}function iterStack(heads){if(!heads.length)return null;let pick=0,picked=heads[0];for(let i=1;i<heads.length;i++){let node=heads[i];if(node.from>picked.from||node.to<picked.to){picked=node;pick=i;}}let next=picked instanceof TreeNode&&picked.index<0?null:picked.parent;let newHeads=heads.slice();if(next)newHeads[pick]=next;else newHeads.splice(pick,1);return new StackIterator(newHeads,picked);}class StackIterator{constructor(heads,node){this.heads=heads;this.node=node;}get next(){return iterStack(this.heads);}}function stackIterator(tree,pos,side){let inner=tree.resolveInner(pos,side),layers=null;for(let scan=inner instanceof TreeNode?inner:inner.context.parent;scan;scan=scan.parent){if(scan.index<0){// This is an overlay root
let parent=scan.parent;(layers||(layers=[inner])).push(parent.resolve(pos,side));scan=parent;}else{let mount=MountedTree.get(scan.tree);// Relevant overlay branching off
if(mount&&mount.overlay&&mount.overlay[0].from<=pos&&mount.overlay[mount.overlay.length-1].to>=pos){let root=new TreeNode(mount.tree,mount.overlay[0].from+scan.from,-1,scan);(layers||(layers=[inner])).push(resolveNode(root,pos,side,false));}}}return layers?iterStack(layers):inner;}/**
  A tree cursor object focuses on a given node in a syntax tree, and
  allows you to move to adjacent nodes.
  */class TreeCursor{/**
      Shorthand for `.type.name`.
      */get name(){return this.type.name;}/**
      @internal
      */constructor(node,/**
      @internal
      */mode=0){this.mode=mode;/**
          @internal
          */this.buffer=null;this.stack=[];/**
          @internal
          */this.index=0;this.bufferNode=null;if(node instanceof TreeNode){this.yieldNode(node);}else{this._tree=node.context.parent;this.buffer=node.context;for(let n=node._parent;n;n=n._parent)this.stack.unshift(n.index);this.bufferNode=node;this.yieldBuf(node.index);}}yieldNode(node){if(!node)return false;this._tree=node;this.type=node.type;this.from=node.from;this.to=node.to;return true;}yieldBuf(index,type){this.index=index;let{start,buffer}=this.buffer;this.type=type||buffer.set.types[buffer.buffer[index]];this.from=start+buffer.buffer[index+1];this.to=start+buffer.buffer[index+2];return true;}/**
      @internal
      */yield(node){if(!node)return false;if(node instanceof TreeNode){this.buffer=null;return this.yieldNode(node);}this.buffer=node.context;return this.yieldBuf(node.index,node.type);}/**
      @internal
      */toString(){return this.buffer?this.buffer.buffer.childString(this.index):this._tree.toString();}/**
      @internal
      */enterChild(dir,pos,side){if(!this.buffer)return this.yield(this._tree.nextChild(dir<0?this._tree._tree.children.length-1:0,dir,pos,side,this.mode));let{buffer}=this.buffer;let index=buffer.findChild(this.index+4,buffer.buffer[this.index+3],dir,pos-this.buffer.start,side);if(index<0)return false;this.stack.push(this.index);return this.yieldBuf(index);}/**
      Move the cursor to this node's first child. When this returns
      false, the node has no child, and the cursor has not been moved.
      */firstChild(){return this.enterChild(1,0,4/* Side.DontCare */);}/**
      Move the cursor to this node's last child.
      */lastChild(){return this.enterChild(-1,0,4/* Side.DontCare */);}/**
      Move the cursor to the first child that ends after `pos`.
      */childAfter(pos){return this.enterChild(1,pos,2/* Side.After */);}/**
      Move to the last child that starts before `pos`.
      */childBefore(pos){return this.enterChild(-1,pos,-2/* Side.Before */);}/**
      Move the cursor to the child around `pos`. If side is -1 the
      child may end at that position, when 1 it may start there. This
      will also enter [overlaid](#common.MountedTree.overlay)
      [mounted](#common.NodeProp^mounted) trees unless `overlays` is
      set to false.
      */enter(pos,side,mode=this.mode){if(!this.buffer)return this.yield(this._tree.enter(pos,side,mode));return mode&IterMode.ExcludeBuffers?false:this.enterChild(1,pos,side);}/**
      Move to the node's parent node, if this isn't the top node.
      */parent(){if(!this.buffer)return this.yieldNode(this.mode&IterMode.IncludeAnonymous?this._tree._parent:this._tree.parent);if(this.stack.length)return this.yieldBuf(this.stack.pop());let parent=this.mode&IterMode.IncludeAnonymous?this.buffer.parent:this.buffer.parent.nextSignificantParent();this.buffer=null;return this.yieldNode(parent);}/**
      @internal
      */sibling(dir){if(!this.buffer)return!this._tree._parent?false:this.yield(this._tree.index<0?null:this._tree._parent.nextChild(this._tree.index+dir,dir,0,4/* Side.DontCare */,this.mode));let{buffer}=this.buffer,d=this.stack.length-1;if(dir<0){let parentStart=d<0?0:this.stack[d]+4;if(this.index!=parentStart)return this.yieldBuf(buffer.findChild(parentStart,this.index,-1,0,4/* Side.DontCare */));}else{let after=buffer.buffer[this.index+3];if(after<(d<0?buffer.buffer.length:buffer.buffer[this.stack[d]+3]))return this.yieldBuf(after);}return d<0?this.yield(this.buffer.parent.nextChild(this.buffer.index+dir,dir,0,4/* Side.DontCare */,this.mode)):false;}/**
      Move to this node's next sibling, if any.
      */nextSibling(){return this.sibling(1);}/**
      Move to this node's previous sibling, if any.
      */prevSibling(){return this.sibling(-1);}atLastNode(dir){let index,parent,{buffer}=this;if(buffer){if(dir>0){if(this.index<buffer.buffer.buffer.length)return false;}else{for(let i=0;i<this.index;i++)if(buffer.buffer.buffer[i+3]<this.index)return false;}({index,parent}=buffer);}else{({index,_parent:parent}=this._tree);}for(;parent;({index,_parent:parent}=parent)){if(index>-1)for(let i=index+dir,e=dir<0?-1:parent._tree.children.length;i!=e;i+=dir){let child=parent._tree.children[i];if(this.mode&IterMode.IncludeAnonymous||child instanceof TreeBuffer||!child.type.isAnonymous||hasChild(child))return false;}}return true;}move(dir,enter){if(enter&&this.enterChild(dir,0,4/* Side.DontCare */))return true;for(;;){if(this.sibling(dir))return true;if(this.atLastNode(dir)||!this.parent())return false;}}/**
      Move to the next node in a
      [pre-order](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order,_NLR)
      traversal, going from a node to its first child or, if the
      current node is empty or `enter` is false, its next sibling or
      the next sibling of the first parent node that has one.
      */next(enter=true){return this.move(1,enter);}/**
      Move to the next node in a last-to-first pre-order traversal. A
      node is followed by its last child or, if it has none, its
      previous sibling or the previous sibling of the first parent
      node that has one.
      */prev(enter=true){return this.move(-1,enter);}/**
      Move the cursor to the innermost node that covers `pos`. If
      `side` is -1, it will enter nodes that end at `pos`. If it is 1,
      it will enter nodes that start at `pos`.
      */moveTo(pos,side=0){// Move up to a node that actually holds the position, if possible
while(this.from==this.to||(side<1?this.from>=pos:this.from>pos)||(side>-1?this.to<=pos:this.to<pos))if(!this.parent())break;// Then scan down into child nodes as far as possible
while(this.enterChild(1,pos,side)){}return this;}/**
      Get a [syntax node](#common.SyntaxNode) at the cursor's current
      position.
      */get node(){if(!this.buffer)return this._tree;let cache=this.bufferNode,result=null,depth=0;if(cache&&cache.context==this.buffer){scan:for(let index=this.index,d=this.stack.length;d>=0;){for(let c=cache;c;c=c._parent)if(c.index==index){if(index==this.index)return c;result=c;depth=d+1;break scan;}index=this.stack[--d];}}for(let i=depth;i<this.stack.length;i++)result=new BufferNode(this.buffer,result,this.stack[i]);return this.bufferNode=new BufferNode(this.buffer,result,this.index);}/**
      Get the [tree](#common.Tree) that represents the current node, if
      any. Will return null when the node is in a [tree
      buffer](#common.TreeBuffer).
      */get tree(){return this.buffer?null:this._tree._tree;}/**
      Iterate over the current node and all its descendants, calling
      `enter` when entering a node and `leave`, if given, when leaving
      one. When `enter` returns `false`, any children of that node are
      skipped, and `leave` isn't called for it.
      */iterate(enter,leave){for(let depth=0;;){let mustLeave=false;if(this.type.isAnonymous||enter(this)!==false){if(this.firstChild()){depth++;continue;}if(!this.type.isAnonymous)mustLeave=true;}for(;;){if(mustLeave&&leave)leave(this);mustLeave=this.type.isAnonymous;if(!depth)return;if(this.nextSibling())break;this.parent();depth--;mustLeave=true;}}}/**
      Test whether the current node matches a given context—a sequence
      of direct parent node names. Empty strings in the context array
      are treated as wildcards.
      */matchContext(context){if(!this.buffer)return matchNodeContext(this.node.parent,context);let{buffer}=this.buffer,{types}=buffer.set;for(let i=context.length-1,d=this.stack.length-1;i>=0;d--){if(d<0)return matchNodeContext(this._tree,context,i);let type=types[buffer.buffer[this.stack[d]]];if(!type.isAnonymous){if(context[i]&&context[i]!=type.name)return false;i--;}}return true;}}function hasChild(tree){return tree.children.some(ch=>ch instanceof TreeBuffer||!ch.type.isAnonymous||hasChild(ch));}function buildTree(data){var _a;let{buffer,nodeSet,maxBufferLength=DefaultBufferLength,reused=[],minRepeatType=nodeSet.types.length}=data;let cursor=Array.isArray(buffer)?new FlatBufferCursor(buffer,buffer.length):buffer;let types=nodeSet.types;let contextHash=0,lookAhead=0;function takeNode(parentStart,minPos,children,positions,inRepeat,depth){let{id,start,end,size}=cursor;let lookAheadAtStart=lookAhead,contextAtStart=contextHash;while(size<0){cursor.next();if(size==-1/* SpecialRecord.Reuse */){let node=reused[id];children.push(node);positions.push(start-parentStart);return;}else if(size==-3/* SpecialRecord.ContextChange */){// Context change
contextHash=id;return;}else if(size==-4/* SpecialRecord.LookAhead */){lookAhead=id;return;}else{throw new RangeError(`Unrecognized record size: ${size}`);}}let type=types[id],node,buffer;let startPos=start-parentStart;if(end-start<=maxBufferLength&&(buffer=findBufferSize(cursor.pos-minPos,inRepeat))){// Small enough for a buffer, and no reused nodes inside
let data=new Uint16Array(buffer.size-buffer.skip);let endPos=cursor.pos-buffer.size,index=data.length;while(cursor.pos>endPos)index=copyToBuffer(buffer.start,data,index);node=new TreeBuffer(data,end-buffer.start,nodeSet);startPos=buffer.start-parentStart;}else{// Make it a node
let endPos=cursor.pos-size;cursor.next();let localChildren=[],localPositions=[];let localInRepeat=id>=minRepeatType?id:-1;let lastGroup=0,lastEnd=end;while(cursor.pos>endPos){if(localInRepeat>=0&&cursor.id==localInRepeat&&cursor.size>=0){if(cursor.end<=lastEnd-maxBufferLength){makeRepeatLeaf(localChildren,localPositions,start,lastGroup,cursor.end,lastEnd,localInRepeat,lookAheadAtStart,contextAtStart);lastGroup=localChildren.length;lastEnd=cursor.end;}cursor.next();}else if(depth>2500/* CutOff.Depth */){takeFlatNode(start,endPos,localChildren,localPositions);}else{takeNode(start,endPos,localChildren,localPositions,localInRepeat,depth+1);}}if(localInRepeat>=0&&lastGroup>0&&lastGroup<localChildren.length)makeRepeatLeaf(localChildren,localPositions,start,lastGroup,start,lastEnd,localInRepeat,lookAheadAtStart,contextAtStart);localChildren.reverse();localPositions.reverse();if(localInRepeat>-1&&lastGroup>0){let make=makeBalanced(type,contextAtStart);node=balanceRange(type,localChildren,localPositions,0,localChildren.length,0,end-start,make,make);}else{node=makeTree(type,localChildren,localPositions,end-start,lookAheadAtStart-end,contextAtStart);}}children.push(node);positions.push(startPos);}function takeFlatNode(parentStart,minPos,children,positions){let nodes=[];// Temporary, inverted array of leaf nodes found, with absolute positions
let nodeCount=0,stopAt=-1;while(cursor.pos>minPos){let{id,start,end,size}=cursor;if(size>4){// Not a leaf
cursor.next();}else if(stopAt>-1&&start<stopAt){break;}else{if(stopAt<0)stopAt=end-maxBufferLength;nodes.push(id,start,end);nodeCount++;cursor.next();}}if(nodeCount){let buffer=new Uint16Array(nodeCount*4);let start=nodes[nodes.length-2];for(let i=nodes.length-3,j=0;i>=0;i-=3){buffer[j++]=nodes[i];buffer[j++]=nodes[i+1]-start;buffer[j++]=nodes[i+2]-start;buffer[j++]=j;}children.push(new TreeBuffer(buffer,nodes[2]-start,nodeSet));positions.push(start-parentStart);}}function makeBalanced(type,contextHash){return(children,positions,length)=>{let lookAhead=0,lastI=children.length-1,last,lookAheadProp;if(lastI>=0&&(last=children[lastI])instanceof Tree){if(!lastI&&last.type==type&&last.length==length)return last;if(lookAheadProp=last.prop(NodeProp.lookAhead))lookAhead=positions[lastI]+last.length+lookAheadProp;}return makeTree(type,children,positions,length,lookAhead,contextHash);};}function makeRepeatLeaf(children,positions,base,i,from,to,type,lookAhead,contextHash){let localChildren=[],localPositions=[];while(children.length>i){localChildren.push(children.pop());localPositions.push(positions.pop()+base-from);}children.push(makeTree(nodeSet.types[type],localChildren,localPositions,to-from,lookAhead-to,contextHash));positions.push(from-base);}function makeTree(type,children,positions,length,lookAhead,contextHash,props){if(contextHash){let pair=[NodeProp.contextHash,contextHash];props=props?[pair].concat(props):[pair];}if(lookAhead>25){let pair=[NodeProp.lookAhead,lookAhead];props=props?[pair].concat(props):[pair];}return new Tree(type,children,positions,length,props);}function findBufferSize(maxSize,inRepeat){// Scan through the buffer to find previous siblings that fit
// together in a TreeBuffer, and don't contain any reused nodes
// (which can't be stored in a buffer).
// If `inRepeat` is > -1, ignore node boundaries of that type for
// nesting, but make sure the end falls either at the start
// (`maxSize`) or before such a node.
let fork=cursor.fork();let size=0,start=0,skip=0,minStart=fork.end-maxBufferLength;let result={size:0,start:0,skip:0};scan:for(let minPos=fork.pos-maxSize;fork.pos>minPos;){let nodeSize=fork.size;// Pretend nested repeat nodes of the same type don't exist
if(fork.id==inRepeat&&nodeSize>=0){// Except that we store the current state as a valid return
// value.
result.size=size;result.start=start;result.skip=skip;skip+=4;size+=4;fork.next();continue;}let startPos=fork.pos-nodeSize;if(nodeSize<0||startPos<minPos||fork.start<minStart)break;let localSkipped=fork.id>=minRepeatType?4:0;let nodeStart=fork.start;fork.next();while(fork.pos>startPos){if(fork.size<0){if(fork.size==-3/* SpecialRecord.ContextChange */)localSkipped+=4;else break scan;}else if(fork.id>=minRepeatType){localSkipped+=4;}fork.next();}start=nodeStart;size+=nodeSize;skip+=localSkipped;}if(inRepeat<0||size==maxSize){result.size=size;result.start=start;result.skip=skip;}return result.size>4?result:undefined;}function copyToBuffer(bufferStart,buffer,index){let{id,start,end,size}=cursor;cursor.next();if(size>=0&&id<minRepeatType){let startIndex=index;if(size>4){let endPos=cursor.pos-(size-4);while(cursor.pos>endPos)index=copyToBuffer(bufferStart,buffer,index);}buffer[--index]=startIndex;buffer[--index]=end-bufferStart;buffer[--index]=start-bufferStart;buffer[--index]=id;}else if(size==-3/* SpecialRecord.ContextChange */){contextHash=id;}else if(size==-4/* SpecialRecord.LookAhead */){lookAhead=id;}return index;}let children=[],positions=[];while(cursor.pos>0)takeNode(data.start||0,data.bufferStart||0,children,positions,-1,0);let length=(_a=data.length)!==null&&_a!==void 0?_a:children.length?positions[0]+children[0].length:0;return new Tree(types[data.topID],children.reverse(),positions.reverse(),length);}const nodeSizeCache=new WeakMap();function nodeSize(balanceType,node){if(!balanceType.isAnonymous||node instanceof TreeBuffer||node.type!=balanceType)return 1;let size=nodeSizeCache.get(node);if(size==null){size=1;for(let child of node.children){if(child.type!=balanceType||!(child instanceof Tree)){size=1;break;}size+=nodeSize(balanceType,child);}nodeSizeCache.set(node,size);}return size;}function balanceRange(// The type the balanced tree's inner nodes.
balanceType,// The direct children and their positions
children,positions,// The index range in children/positions to use
from,to,// The start position of the nodes, relative to their parent.
start,// Length of the outer node
length,// Function to build the top node of the balanced tree
mkTop,// Function to build internal nodes for the balanced tree
mkTree){let total=0;for(let i=from;i<to;i++)total+=nodeSize(balanceType,children[i]);let maxChild=Math.ceil(total*1.5/8/* Balance.BranchFactor */);let localChildren=[],localPositions=[];function divide(children,positions,from,to,offset){for(let i=from;i<to;){let groupFrom=i,groupStart=positions[i],groupSize=nodeSize(balanceType,children[i]);i++;for(;i<to;i++){let nextSize=nodeSize(balanceType,children[i]);if(groupSize+nextSize>=maxChild)break;groupSize+=nextSize;}if(i==groupFrom+1){if(groupSize>maxChild){let only=children[groupFrom];// Only trees can have a size > 1
divide(only.children,only.positions,0,only.children.length,positions[groupFrom]+offset);continue;}localChildren.push(children[groupFrom]);}else{let length=positions[i-1]+children[i-1].length-groupStart;localChildren.push(balanceRange(balanceType,children,positions,groupFrom,i,groupStart,length,null,mkTree));}localPositions.push(groupStart+offset-start);}}divide(children,positions,from,to,0);return(mkTop||mkTree)(localChildren,localPositions,length);}/**
  Provides a way to associate values with pieces of trees. As long
  as that part of the tree is reused, the associated values can be
  retrieved from an updated tree.
  */class NodeWeakMap{constructor(){this.map=new WeakMap();}setBuffer(buffer,index,value){let inner=this.map.get(buffer);if(!inner)this.map.set(buffer,inner=new Map());inner.set(index,value);}getBuffer(buffer,index){let inner=this.map.get(buffer);return inner&&inner.get(index);}/**
      Set the value for this syntax node.
      */set(node,value){if(node instanceof BufferNode)this.setBuffer(node.context.buffer,node.index,value);else if(node instanceof TreeNode)this.map.set(node.tree,value);}/**
      Retrieve value for this syntax node, if it exists in the map.
      */get(node){return node instanceof BufferNode?this.getBuffer(node.context.buffer,node.index):node instanceof TreeNode?this.map.get(node.tree):undefined;}/**
      Set the value for the node that a cursor currently points to.
      */cursorSet(cursor,value){if(cursor.buffer)this.setBuffer(cursor.buffer.buffer,cursor.index,value);else this.map.set(cursor.tree,value);}/**
      Retrieve the value for the node that a cursor currently points
      to.
      */cursorGet(cursor){return cursor.buffer?this.getBuffer(cursor.buffer.buffer,cursor.index):this.map.get(cursor.tree);}}/**
  Tree fragments are used during [incremental
  parsing](#common.Parser.startParse) to track parts of old trees
  that can be reused in a new parse. An array of fragments is used
  to track regions of an old tree whose nodes might be reused in new
  parses. Use the static
  [`applyChanges`](#common.TreeFragment^applyChanges) method to
  update fragments for document changes.
  */class TreeFragment{/**
      Construct a tree fragment. You'll usually want to use
      [`addTree`](#common.TreeFragment^addTree) and
      [`applyChanges`](#common.TreeFragment^applyChanges) instead of
      calling this directly.
      */constructor(/**
      The start of the unchanged range pointed to by this fragment.
      This refers to an offset in the _updated_ document (as opposed
      to the original tree).
      */from,/**
      The end of the unchanged range.
      */to,/**
      The tree that this fragment is based on.
      */tree,/**
      The offset between the fragment's tree and the document that
      this fragment can be used against. Add this when going from
      document to tree positions, subtract it to go from tree to
      document positions.
      */offset,openStart=false,openEnd=false){this.from=from;this.to=to;this.tree=tree;this.offset=offset;this.open=(openStart?1/* Open.Start */:0)|(openEnd?2/* Open.End */:0);}/**
      Whether the start of the fragment represents the start of a
      parse, or the end of a change. (In the second case, it may not
      be safe to reuse some nodes at the start, depending on the
      parsing algorithm.)
      */get openStart(){return(this.open&1/* Open.Start */)>0;}/**
      Whether the end of the fragment represents the end of a
      full-document parse, or the start of a change.
      */get openEnd(){return(this.open&2/* Open.End */)>0;}/**
      Create a set of fragments from a freshly parsed tree, or update
      an existing set of fragments by replacing the ones that overlap
      with a tree with content from the new tree. When `partial` is
      true, the parse is treated as incomplete, and the resulting
      fragment has [`openEnd`](#common.TreeFragment.openEnd) set to
      true.
      */static addTree(tree,fragments=[],partial=false){let result=[new TreeFragment(0,tree.length,tree,0,false,partial)];for(let f of fragments)if(f.to>tree.length)result.push(f);return result;}/**
      Apply a set of edits to an array of fragments, removing or
      splitting fragments as necessary to remove edited ranges, and
      adjusting offsets for fragments that moved.
      */static applyChanges(fragments,changes,minGap=128){if(!changes.length)return fragments;let result=[];let fI=1,nextF=fragments.length?fragments[0]:null;for(let cI=0,pos=0,off=0;;cI++){let nextC=cI<changes.length?changes[cI]:null;let nextPos=nextC?nextC.fromA:1e9;if(nextPos-pos>=minGap)while(nextF&&nextF.from<nextPos){let cut=nextF;if(pos>=cut.from||nextPos<=cut.to||off){let fFrom=Math.max(cut.from,pos)-off,fTo=Math.min(cut.to,nextPos)-off;cut=fFrom>=fTo?null:new TreeFragment(fFrom,fTo,cut.tree,cut.offset+off,cI>0,!!nextC);}if(cut)result.push(cut);if(nextF.to>nextPos)break;nextF=fI<fragments.length?fragments[fI++]:null;}if(!nextC)break;pos=nextC.toA;off=nextC.toA-nextC.toB;}return result;}}/**
  A superclass that parsers should extend.
  */class Parser{/**
      Start a parse, returning a [partial parse](#common.PartialParse)
      object. [`fragments`](#common.TreeFragment) can be passed in to
      make the parse incremental.
      
      By default, the entire input is parsed. You can pass `ranges`,
      which should be a sorted array of non-empty, non-overlapping
      ranges, to parse only those ranges. The tree returned in that
      case will start at `ranges[0].from`.
      */startParse(input,fragments,ranges){if(typeof input=="string")input=new StringInput(input);ranges=!ranges?[new Range(0,input.length)]:ranges.length?ranges.map(r=>new Range(r.from,r.to)):[new Range(0,0)];return this.createParse(input,fragments||[],ranges);}/**
      Run a full parse, returning the resulting tree.
      */parse(input,fragments,ranges){let parse=this.startParse(input,fragments,ranges);for(;;){let done=parse.advance();if(done)return done;}}}class StringInput{constructor(string){this.string=string;}get length(){return this.string.length;}chunk(from){return this.string.slice(from);}get lineChunks(){return false;}read(from,to){return this.string.slice(from,to);}}/**
  Create a parse wrapper that, after the inner parse completes,
  scans its tree for mixed language regions with the `nest`
  function, runs the resulting [inner parses](#common.NestedParse),
  and then [mounts](#common.NodeProp^mounted) their results onto the
  tree.
  */function parseMixed(nest){return(parse,input,fragments,ranges)=>new MixedParse(parse,nest,input,fragments,ranges);}class InnerParse{constructor(parser,parse,overlay,target,from){this.parser=parser;this.parse=parse;this.overlay=overlay;this.target=target;this.from=from;}}function checkRanges(ranges){if(!ranges.length||ranges.some(r=>r.from>=r.to))throw new RangeError("Invalid inner parse ranges given: "+JSON.stringify(ranges));}class ActiveOverlay{constructor(parser,predicate,mounts,index,start,target,prev){this.parser=parser;this.predicate=predicate;this.mounts=mounts;this.index=index;this.start=start;this.target=target;this.prev=prev;this.depth=0;this.ranges=[];}}const stoppedInner=new NodeProp({perNode:true});class MixedParse{constructor(base,nest,input,fragments,ranges){this.nest=nest;this.input=input;this.fragments=fragments;this.ranges=ranges;this.inner=[];this.innerDone=0;this.baseTree=null;this.stoppedAt=null;this.baseParse=base;}advance(){if(this.baseParse){let done=this.baseParse.advance();if(!done)return null;this.baseParse=null;this.baseTree=done;this.startInner();if(this.stoppedAt!=null)for(let inner of this.inner)inner.parse.stopAt(this.stoppedAt);}if(this.innerDone==this.inner.length){let result=this.baseTree;if(this.stoppedAt!=null)result=new Tree(result.type,result.children,result.positions,result.length,result.propValues.concat([[stoppedInner,this.stoppedAt]]));return result;}let inner=this.inner[this.innerDone],done=inner.parse.advance();if(done){this.innerDone++;// This is a somewhat dodgy but super helpful hack where we
// patch up nodes created by the inner parse (and thus
// presumably not aliased anywhere else) to hold the information
// about the inner parse.
let props=Object.assign(Object.create(null),inner.target.props);props[NodeProp.mounted.id]=new MountedTree(done,inner.overlay,inner.parser);inner.target.props=props;}return null;}get parsedPos(){if(this.baseParse)return 0;let pos=this.input.length;for(let i=this.innerDone;i<this.inner.length;i++){if(this.inner[i].from<pos)pos=Math.min(pos,this.inner[i].parse.parsedPos);}return pos;}stopAt(pos){this.stoppedAt=pos;if(this.baseParse)this.baseParse.stopAt(pos);else for(let i=this.innerDone;i<this.inner.length;i++)this.inner[i].parse.stopAt(pos);}startInner(){let fragmentCursor=new FragmentCursor$1(this.fragments);let overlay=null;let covered=null;let cursor=new TreeCursor(new TreeNode(this.baseTree,this.ranges[0].from,0,null),IterMode.IncludeAnonymous|IterMode.IgnoreMounts);scan:for(let nest,isCovered;;){let enter=true,range;if(this.stoppedAt!=null&&cursor.from>=this.stoppedAt){enter=false;}else if(fragmentCursor.hasNode(cursor)){if(overlay){let match=overlay.mounts.find(m=>m.frag.from<=cursor.from&&m.frag.to>=cursor.to&&m.mount.overlay);if(match)for(let r of match.mount.overlay){let from=r.from+match.pos,to=r.to+match.pos;if(from>=cursor.from&&to<=cursor.to&&!overlay.ranges.some(r=>r.from<to&&r.to>from))overlay.ranges.push({from,to});}}enter=false;}else if(covered&&(isCovered=checkCover(covered.ranges,cursor.from,cursor.to))){enter=isCovered!=2/* Cover.Full */;}else if(!cursor.type.isAnonymous&&(nest=this.nest(cursor,this.input))&&(cursor.from<cursor.to||!nest.overlay)){if(!cursor.tree)materialize(cursor);let oldMounts=fragmentCursor.findMounts(cursor.from,nest.parser);if(typeof nest.overlay=="function"){overlay=new ActiveOverlay(nest.parser,nest.overlay,oldMounts,this.inner.length,cursor.from,cursor.tree,overlay);}else{let ranges=punchRanges(this.ranges,nest.overlay||(cursor.from<cursor.to?[new Range(cursor.from,cursor.to)]:[]));if(ranges.length)checkRanges(ranges);if(ranges.length||!nest.overlay)this.inner.push(new InnerParse(nest.parser,ranges.length?nest.parser.startParse(this.input,enterFragments(oldMounts,ranges),ranges):nest.parser.startParse(""),nest.overlay?nest.overlay.map(r=>new Range(r.from-cursor.from,r.to-cursor.from)):null,cursor.tree,ranges.length?ranges[0].from:cursor.from));if(!nest.overlay)enter=false;else if(ranges.length)covered={ranges,depth:0,prev:covered};}}else if(overlay&&(range=overlay.predicate(cursor))){if(range===true)range=new Range(cursor.from,cursor.to);if(range.from<range.to){let last=overlay.ranges.length-1;if(last>=0&&overlay.ranges[last].to==range.from)overlay.ranges[last]={from:overlay.ranges[last].from,to:range.to};else overlay.ranges.push(range);}}if(enter&&cursor.firstChild()){if(overlay)overlay.depth++;if(covered)covered.depth++;}else{for(;;){if(cursor.nextSibling())break;if(!cursor.parent())break scan;if(overlay&&! --overlay.depth){let ranges=punchRanges(this.ranges,overlay.ranges);if(ranges.length){checkRanges(ranges);this.inner.splice(overlay.index,0,new InnerParse(overlay.parser,overlay.parser.startParse(this.input,enterFragments(overlay.mounts,ranges),ranges),overlay.ranges.map(r=>new Range(r.from-overlay.start,r.to-overlay.start)),overlay.target,ranges[0].from));}overlay=overlay.prev;}if(covered&&! --covered.depth)covered=covered.prev;}}}}}function checkCover(covered,from,to){for(let range of covered){if(range.from>=to)break;if(range.to>from)return range.from<=from&&range.to>=to?2/* Cover.Full */:1/* Cover.Partial */;}return 0/* Cover.None */;}// Take a piece of buffer and convert it into a stand-alone
// TreeBuffer.
function sliceBuf(buf,startI,endI,nodes,positions,off){if(startI<endI){let from=buf.buffer[startI+1];nodes.push(buf.slice(startI,endI,from));positions.push(from-off);}}// This function takes a node that's in a buffer, and converts it, and
// its parent buffer nodes, into a Tree. This is again acting on the
// assumption that the trees and buffers have been constructed by the
// parse that was ran via the mix parser, and thus aren't shared with
// any other code, making violations of the immutability safe.
function materialize(cursor){let{node}=cursor,stack=[];let buffer=node.context.buffer;// Scan up to the nearest tree
do{stack.push(cursor.index);cursor.parent();}while(!cursor.tree);// Find the index of the buffer in that tree
let base=cursor.tree,i=base.children.indexOf(buffer);let buf=base.children[i],b=buf.buffer,newStack=[i];// Split a level in the buffer, putting the nodes before and after
// the child that contains `node` into new buffers.
function split(startI,endI,type,innerOffset,length,stackPos){let targetI=stack[stackPos];let children=[],positions=[];sliceBuf(buf,startI,targetI,children,positions,innerOffset);let from=b[targetI+1],to=b[targetI+2];newStack.push(children.length);let child=stackPos?split(targetI+4,b[targetI+3],buf.set.types[b[targetI]],from,to-from,stackPos-1):node.toTree();children.push(child);positions.push(from-innerOffset);sliceBuf(buf,b[targetI+3],endI,children,positions,innerOffset);return new Tree(type,children,positions,length);}base.children[i]=split(0,b.length,NodeType.none,0,buf.length,stack.length-1);// Move the cursor back to the target node
for(let index of newStack){let tree=cursor.tree.children[index],pos=cursor.tree.positions[index];cursor.yield(new TreeNode(tree,pos+cursor.from,index,cursor._tree));}}class StructureCursor{constructor(root,offset){this.offset=offset;this.done=false;this.cursor=root.cursor(IterMode.IncludeAnonymous|IterMode.IgnoreMounts);}// Move to the first node (in pre-order) that starts at or after `pos`.
moveTo(pos){let{cursor}=this,p=pos-this.offset;while(!this.done&&cursor.from<p){if(cursor.to>=pos&&cursor.enter(p,1,IterMode.IgnoreOverlays|IterMode.ExcludeBuffers));else if(!cursor.next(false))this.done=true;}}hasNode(cursor){this.moveTo(cursor.from);if(!this.done&&this.cursor.from+this.offset==cursor.from&&this.cursor.tree){for(let tree=this.cursor.tree;;){if(tree==cursor.tree)return true;if(tree.children.length&&tree.positions[0]==0&&tree.children[0]instanceof Tree)tree=tree.children[0];else break;}}return false;}}let FragmentCursor$1=class FragmentCursor{constructor(fragments){var _a;this.fragments=fragments;this.curTo=0;this.fragI=0;if(fragments.length){let first=this.curFrag=fragments[0];this.curTo=(_a=first.tree.prop(stoppedInner))!==null&&_a!==void 0?_a:first.to;this.inner=new StructureCursor(first.tree,-first.offset);}else{this.curFrag=this.inner=null;}}hasNode(node){while(this.curFrag&&node.from>=this.curTo)this.nextFrag();return this.curFrag&&this.curFrag.from<=node.from&&this.curTo>=node.to&&this.inner.hasNode(node);}nextFrag(){var _a;this.fragI++;if(this.fragI==this.fragments.length){this.curFrag=this.inner=null;}else{let frag=this.curFrag=this.fragments[this.fragI];this.curTo=(_a=frag.tree.prop(stoppedInner))!==null&&_a!==void 0?_a:frag.to;this.inner=new StructureCursor(frag.tree,-frag.offset);}}findMounts(pos,parser){var _a;let result=[];if(this.inner){this.inner.cursor.moveTo(pos,1);for(let pos=this.inner.cursor.node;pos;pos=pos.parent){let mount=(_a=pos.tree)===null||_a===void 0?void 0:_a.prop(NodeProp.mounted);if(mount&&mount.parser==parser){for(let i=this.fragI;i<this.fragments.length;i++){let frag=this.fragments[i];if(frag.from>=pos.to)break;if(frag.tree==this.curFrag.tree)result.push({frag,pos:pos.from-frag.offset,mount});}}}}return result;}};function punchRanges(outer,ranges){let copy=null,current=ranges;for(let i=1,j=0;i<outer.length;i++){let gapFrom=outer[i-1].to,gapTo=outer[i].from;for(;j<current.length;j++){let r=current[j];if(r.from>=gapTo)break;if(r.to<=gapFrom)continue;if(!copy)current=copy=ranges.slice();if(r.from<gapFrom){copy[j]=new Range(r.from,gapFrom);if(r.to>gapTo)copy.splice(j+1,0,new Range(gapTo,r.to));}else if(r.to>gapTo){copy[j--]=new Range(gapTo,r.to);}else{copy.splice(j--,1);}}}return current;}function findCoverChanges(a,b,from,to){let iA=0,iB=0,inA=false,inB=false,pos=-1e9;let result=[];for(;;){let nextA=iA==a.length?1e9:inA?a[iA].to:a[iA].from;let nextB=iB==b.length?1e9:inB?b[iB].to:b[iB].from;if(inA!=inB){let start=Math.max(pos,from),end=Math.min(nextA,nextB,to);if(start<end)result.push(new Range(start,end));}pos=Math.min(nextA,nextB);if(pos==1e9)break;if(nextA==pos){if(!inA)inA=true;else{inA=false;iA++;}}if(nextB==pos){if(!inB)inB=true;else{inB=false;iB++;}}}return result;}// Given a number of fragments for the outer tree, and a set of ranges
// to parse, find fragments for inner trees mounted around those
// ranges, if any.
function enterFragments(mounts,ranges){let result=[];for(let{pos,mount,frag}of mounts){let startPos=pos+(mount.overlay?mount.overlay[0].from:0),endPos=startPos+mount.tree.length;let from=Math.max(frag.from,startPos),to=Math.min(frag.to,endPos);if(mount.overlay){let overlay=mount.overlay.map(r=>new Range(r.from+pos,r.to+pos));let changes=findCoverChanges(ranges,overlay,from,to);for(let i=0,pos=from;;i++){let last=i==changes.length,end=last?to:changes[i].from;if(end>pos)result.push(new TreeFragment(pos,end,mount.tree,-startPos,frag.from>=pos||frag.openStart,frag.to<=end||frag.openEnd));if(last)break;pos=changes[i].to;}}else{result.push(new TreeFragment(from,to,mount.tree,-startPos,frag.from>=startPos||frag.openStart,frag.to<=endPos||frag.openEnd));}}return result;}let nextTagID=0;/**
  Highlighting tags are markers that denote a highlighting category.
  They are [associated](#highlight.styleTags) with parts of a syntax
  tree by a language mode, and then mapped to an actual CSS style by
  a [highlighter](#highlight.Highlighter).

  Because syntax tree node types and highlight styles have to be
  able to talk the same language, CodeMirror uses a mostly _closed_
  [vocabulary](#highlight.tags) of syntax tags (as opposed to
  traditional open string-based systems, which make it hard for
  highlighting themes to cover all the tokens produced by the
  various languages).

  It _is_ possible to [define](#highlight.Tag^define) your own
  highlighting tags for system-internal use (where you control both
  the language package and the highlighter), but such tags will not
  be picked up by regular highlighters (though you can derive them
  from standard tags to allow highlighters to fall back to those).
  */class Tag{/**
      @internal
      */constructor(/**
      The optional name of the base tag @internal
      */name,/**
      The set of this tag and all its parent tags, starting with
      this one itself and sorted in order of decreasing specificity.
      */set,/**
      The base unmodified tag that this one is based on, if it's
      modified @internal
      */base,/**
      The modifiers applied to this.base @internal
      */modified){this.name=name;this.set=set;this.base=base;this.modified=modified;/**
          @internal
          */this.id=nextTagID++;}toString(){let{name}=this;for(let mod of this.modified)if(mod.name)name=`${mod.name}(${name})`;return name;}static define(nameOrParent,parent){let name=typeof nameOrParent=="string"?nameOrParent:"?";if(nameOrParent instanceof Tag)parent=nameOrParent;if(parent===null||parent===void 0?void 0:parent.base)throw new Error("Can not derive from a modified tag");let tag=new Tag(name,[],null,[]);tag.set.push(tag);if(parent)for(let t of parent.set)tag.set.push(t);return tag;}/**
      Define a tag _modifier_, which is a function that, given a tag,
      will return a tag that is a subtag of the original. Applying the
      same modifier to a twice tag will return the same value (`m1(t1)
      == m1(t1)`) and applying multiple modifiers will, regardless or
      order, produce the same tag (`m1(m2(t1)) == m2(m1(t1))`).
      
      When multiple modifiers are applied to a given base tag, each
      smaller set of modifiers is registered as a parent, so that for
      example `m1(m2(m3(t1)))` is a subtype of `m1(m2(t1))`,
      `m1(m3(t1)`, and so on.
      */static defineModifier(name){let mod=new Modifier(name);return tag=>{if(tag.modified.indexOf(mod)>-1)return tag;return Modifier.get(tag.base||tag,tag.modified.concat(mod).sort((a,b)=>a.id-b.id));};}}let nextModifierID=0;class Modifier{constructor(name){this.name=name;this.instances=[];this.id=nextModifierID++;}static get(base,mods){if(!mods.length)return base;let exists=mods[0].instances.find(t=>t.base==base&&sameArray(mods,t.modified));if(exists)return exists;let set=[],tag=new Tag(base.name,set,base,mods);for(let m of mods)m.instances.push(tag);let configs=powerSet(mods);for(let parent of base.set)if(!parent.modified.length)for(let config of configs)set.push(Modifier.get(parent,config));return tag;}}function sameArray(a,b){return a.length==b.length&&a.every((x,i)=>x==b[i]);}function powerSet(array){let sets=[[]];for(let i=0;i<array.length;i++){for(let j=0,e=sets.length;j<e;j++){sets.push(sets[j].concat(array[i]));}}return sets.sort((a,b)=>b.length-a.length);}/**
  This function is used to add a set of tags to a language syntax
  via [`NodeSet.extend`](#common.NodeSet.extend) or
  [`LRParser.configure`](#lr.LRParser.configure).

  The argument object maps node selectors to [highlighting
  tags](#highlight.Tag) or arrays of tags.

  Node selectors may hold one or more (space-separated) node paths.
  Such a path can be a [node name](#common.NodeType.name), or
  multiple node names (or `*` wildcards) separated by slash
  characters, as in `"Block/Declaration/VariableName"`. Such a path
  matches the final node but only if its direct parent nodes are the
  other nodes mentioned. A `*` in such a path matches any parent,
  but only a single level—wildcards that match multiple parents
  aren't supported, both for efficiency reasons and because Lezer
  trees make it rather hard to reason about what they would match.)

  A path can be ended with `/...` to indicate that the tag assigned
  to the node should also apply to all child nodes, even if they
  match their own style (by default, only the innermost style is
  used).

  When a path ends in `!`, as in `Attribute!`, no further matching
  happens for the node's child nodes, and the entire node gets the
  given style.

  In this notation, node names that contain `/`, `!`, `*`, or `...`
  must be quoted as JSON strings.

  For example:

  ```javascript
  parser.withProps(
    styleTags({
      // Style Number and BigNumber nodes
      "Number BigNumber": tags.number,
      // Style Escape nodes whose parent is String
      "String/Escape": tags.escape,
      // Style anything inside Attributes nodes
      "Attributes!": tags.meta,
      // Add a style to all content inside Italic nodes
      "Italic/...": tags.emphasis,
      // Style InvalidString nodes as both `string` and `invalid`
      "InvalidString": [tags.string, tags.invalid],
      // Style the node named "/" as punctuation
      '"/"': tags.punctuation
    })
  )
  ```
  */function styleTags(spec){let byName=Object.create(null);for(let prop in spec){let tags=spec[prop];if(!Array.isArray(tags))tags=[tags];for(let part of prop.split(" "))if(part){let pieces=[],mode=2/* Mode.Normal */,rest=part;for(let pos=0;;){if(rest=="..."&&pos>0&&pos+3==part.length){mode=1/* Mode.Inherit */;break;}let m=/^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(rest);if(!m)throw new RangeError("Invalid path: "+part);pieces.push(m[0]=="*"?"":m[0][0]=='"'?JSON.parse(m[0]):m[0]);pos+=m[0].length;if(pos==part.length)break;let next=part[pos++];if(pos==part.length&&next=="!"){mode=0/* Mode.Opaque */;break;}if(next!="/")throw new RangeError("Invalid path: "+part);rest=part.slice(pos);}let last=pieces.length-1,inner=pieces[last];if(!inner)throw new RangeError("Invalid path: "+part);let rule=new Rule(tags,mode,last>0?pieces.slice(0,last):null);byName[inner]=rule.sort(byName[inner]);}}return ruleNodeProp.add(byName);}const ruleNodeProp=new NodeProp();class Rule{constructor(tags,mode,context,next){this.tags=tags;this.mode=mode;this.context=context;this.next=next;}get opaque(){return this.mode==0/* Mode.Opaque */;}get inherit(){return this.mode==1/* Mode.Inherit */;}sort(other){if(!other||other.depth<this.depth){this.next=other;return this;}other.next=this.sort(other.next);return other;}get depth(){return this.context?this.context.length:0;}}Rule.empty=new Rule([],2/* Mode.Normal */,null);/**
  Define a [highlighter](#highlight.Highlighter) from an array of
  tag/class pairs. Classes associated with more specific tags will
  take precedence.
  */function tagHighlighter(tags,options){let map=Object.create(null);for(let style of tags){if(!Array.isArray(style.tag))map[style.tag.id]=style.class;else for(let tag of style.tag)map[tag.id]=style.class;}let{scope,all=null}=options||{};return{style:tags=>{let cls=all;for(let tag of tags){for(let sub of tag.set){let tagClass=map[sub.id];if(tagClass){cls=cls?cls+" "+tagClass:tagClass;break;}}}return cls;},scope};}function highlightTags(highlighters,tags){let result=null;for(let highlighter of highlighters){let value=highlighter.style(tags);if(value)result=result?result+" "+value:value;}return result;}/**
  Highlight the given [tree](#common.Tree) with the given
  [highlighter](#highlight.Highlighter). Often, the higher-level
  [`highlightCode`](#highlight.highlightCode) function is easier to
  use.
  */function highlightTree(tree,highlighter,/**
  Assign styling to a region of the text. Will be called, in order
  of position, for any ranges where more than zero classes apply.
  `classes` is a space separated string of CSS classes.
  */putStyle,/**
  The start of the range to highlight.
  */from=0,/**
  The end of the range.
  */to=tree.length){let builder=new HighlightBuilder(from,Array.isArray(highlighter)?highlighter:[highlighter],putStyle);builder.highlightRange(tree.cursor(),from,to,"",builder.highlighters);builder.flush(to);}class HighlightBuilder{constructor(at,highlighters,span){this.at=at;this.highlighters=highlighters;this.span=span;this.class="";}startSpan(at,cls){if(cls!=this.class){this.flush(at);if(at>this.at)this.at=at;this.class=cls;}}flush(to){if(to>this.at&&this.class)this.span(this.at,to,this.class);}highlightRange(cursor,from,to,inheritedClass,highlighters){let{type,from:start,to:end}=cursor;if(start>=to||end<=from)return;if(type.isTop)highlighters=this.highlighters.filter(h=>!h.scope||h.scope(type));let cls=inheritedClass;let rule=getStyleTags(cursor)||Rule.empty;let tagCls=highlightTags(highlighters,rule.tags);if(tagCls){if(cls)cls+=" ";cls+=tagCls;if(rule.mode==1/* Mode.Inherit */)inheritedClass+=(inheritedClass?" ":"")+tagCls;}this.startSpan(Math.max(from,start),cls);if(rule.opaque)return;let mounted=cursor.tree&&cursor.tree.prop(NodeProp.mounted);if(mounted&&mounted.overlay){let inner=cursor.node.enter(mounted.overlay[0].from+start,1);let innerHighlighters=this.highlighters.filter(h=>!h.scope||h.scope(mounted.tree.type));let hasChild=cursor.firstChild();for(let i=0,pos=start;;i++){let next=i<mounted.overlay.length?mounted.overlay[i]:null;let nextPos=next?next.from+start:end;let rangeFrom=Math.max(from,pos),rangeTo=Math.min(to,nextPos);if(rangeFrom<rangeTo&&hasChild){while(cursor.from<rangeTo){this.highlightRange(cursor,rangeFrom,rangeTo,inheritedClass,highlighters);this.startSpan(Math.min(rangeTo,cursor.to),cls);if(cursor.to>=nextPos||!cursor.nextSibling())break;}}if(!next||nextPos>to)break;pos=next.to+start;if(pos>from){this.highlightRange(inner.cursor(),Math.max(from,next.from+start),Math.min(to,pos),"",innerHighlighters);this.startSpan(Math.min(to,pos),cls);}}if(hasChild)cursor.parent();}else if(cursor.firstChild()){if(mounted)inheritedClass="";do{if(cursor.to<=from)continue;if(cursor.from>=to)break;this.highlightRange(cursor,from,to,inheritedClass,highlighters);this.startSpan(Math.min(to,cursor.to),cls);}while(cursor.nextSibling());cursor.parent();}}}/**
  Match a syntax node's [highlight rules](#highlight.styleTags). If
  there's a match, return its set of tags, and whether it is
  opaque (uses a `!`) or applies to all child nodes (`/...`).
  */function getStyleTags(node){let rule=node.type.prop(ruleNodeProp);while(rule&&rule.context&&!node.matchContext(rule.context))rule=rule.next;return rule||null;}const t=Tag.define;const comment=t(),name=t(),typeName=t(name),propertyName=t(name),literal=t(),string=t(literal),number=t(literal),content=t(),heading=t(content),keyword=t(),operator=t(),punctuation=t(),bracket=t(punctuation),meta=t();/**
  The default set of highlighting [tags](#highlight.Tag).

  This collection is heavily biased towards programming languages,
  and necessarily incomplete. A full ontology of syntactic
  constructs would fill a stack of books, and be impractical to
  write themes for. So try to make do with this set. If all else
  fails, [open an
  issue](https://github.com/codemirror/codemirror.next) to propose a
  new tag, or [define](#highlight.Tag^define) a local custom tag for
  your use case.

  Note that it is not obligatory to always attach the most specific
  tag possible to an element—if your grammar can't easily
  distinguish a certain type of element (such as a local variable),
  it is okay to style it as its more general variant (a variable).

  For tags that extend some parent tag, the documentation links to
  the parent.
  */const tags$1={/**
      A comment.
      */comment,/**
      A line [comment](#highlight.tags.comment).
      */lineComment:t(comment),/**
      A block [comment](#highlight.tags.comment).
      */blockComment:t(comment),/**
      A documentation [comment](#highlight.tags.comment).
      */docComment:t(comment),/**
      Any kind of identifier.
      */name,/**
      The [name](#highlight.tags.name) of a variable.
      */variableName:t(name),/**
      A type [name](#highlight.tags.name).
      */typeName:typeName,/**
      A tag name (subtag of [`typeName`](#highlight.tags.typeName)).
      */tagName:t(typeName),/**
      A property or field [name](#highlight.tags.name).
      */propertyName:propertyName,/**
      An attribute name (subtag of [`propertyName`](#highlight.tags.propertyName)).
      */attributeName:t(propertyName),/**
      The [name](#highlight.tags.name) of a class.
      */className:t(name),/**
      A label [name](#highlight.tags.name).
      */labelName:t(name),/**
      A namespace [name](#highlight.tags.name).
      */namespace:t(name),/**
      The [name](#highlight.tags.name) of a macro.
      */macroName:t(name),/**
      A literal value.
      */literal,/**
      A string [literal](#highlight.tags.literal).
      */string,/**
      A documentation [string](#highlight.tags.string).
      */docString:t(string),/**
      A character literal (subtag of [string](#highlight.tags.string)).
      */character:t(string),/**
      An attribute value (subtag of [string](#highlight.tags.string)).
      */attributeValue:t(string),/**
      A number [literal](#highlight.tags.literal).
      */number,/**
      An integer [number](#highlight.tags.number) literal.
      */integer:t(number),/**
      A floating-point [number](#highlight.tags.number) literal.
      */float:t(number),/**
      A boolean [literal](#highlight.tags.literal).
      */bool:t(literal),/**
      Regular expression [literal](#highlight.tags.literal).
      */regexp:t(literal),/**
      An escape [literal](#highlight.tags.literal), for example a
      backslash escape in a string.
      */escape:t(literal),/**
      A color [literal](#highlight.tags.literal).
      */color:t(literal),/**
      A URL [literal](#highlight.tags.literal).
      */url:t(literal),/**
      A language keyword.
      */keyword,/**
      The [keyword](#highlight.tags.keyword) for the self or this
      object.
      */self:t(keyword),/**
      The [keyword](#highlight.tags.keyword) for null.
      */null:t(keyword),/**
      A [keyword](#highlight.tags.keyword) denoting some atomic value.
      */atom:t(keyword),/**
      A [keyword](#highlight.tags.keyword) that represents a unit.
      */unit:t(keyword),/**
      A modifier [keyword](#highlight.tags.keyword).
      */modifier:t(keyword),/**
      A [keyword](#highlight.tags.keyword) that acts as an operator.
      */operatorKeyword:t(keyword),/**
      A control-flow related [keyword](#highlight.tags.keyword).
      */controlKeyword:t(keyword),/**
      A [keyword](#highlight.tags.keyword) that defines something.
      */definitionKeyword:t(keyword),/**
      A [keyword](#highlight.tags.keyword) related to defining or
      interfacing with modules.
      */moduleKeyword:t(keyword),/**
      An operator.
      */operator,/**
      An [operator](#highlight.tags.operator) that dereferences something.
      */derefOperator:t(operator),/**
      Arithmetic-related [operator](#highlight.tags.operator).
      */arithmeticOperator:t(operator),/**
      Logical [operator](#highlight.tags.operator).
      */logicOperator:t(operator),/**
      Bit [operator](#highlight.tags.operator).
      */bitwiseOperator:t(operator),/**
      Comparison [operator](#highlight.tags.operator).
      */compareOperator:t(operator),/**
      [Operator](#highlight.tags.operator) that updates its operand.
      */updateOperator:t(operator),/**
      [Operator](#highlight.tags.operator) that defines something.
      */definitionOperator:t(operator),/**
      Type-related [operator](#highlight.tags.operator).
      */typeOperator:t(operator),/**
      Control-flow [operator](#highlight.tags.operator).
      */controlOperator:t(operator),/**
      Program or markup punctuation.
      */punctuation,/**
      [Punctuation](#highlight.tags.punctuation) that separates
      things.
      */separator:t(punctuation),/**
      Bracket-style [punctuation](#highlight.tags.punctuation).
      */bracket,/**
      Angle [brackets](#highlight.tags.bracket) (usually `<` and `>`
      tokens).
      */angleBracket:t(bracket),/**
      Square [brackets](#highlight.tags.bracket) (usually `[` and `]`
      tokens).
      */squareBracket:t(bracket),/**
      Parentheses (usually `(` and `)` tokens). Subtag of
      [bracket](#highlight.tags.bracket).
      */paren:t(bracket),/**
      Braces (usually `{` and `}` tokens). Subtag of
      [bracket](#highlight.tags.bracket).
      */brace:t(bracket),/**
      Content, for example plain text in XML or markup documents.
      */content,/**
      [Content](#highlight.tags.content) that represents a heading.
      */heading,/**
      A level 1 [heading](#highlight.tags.heading).
      */heading1:t(heading),/**
      A level 2 [heading](#highlight.tags.heading).
      */heading2:t(heading),/**
      A level 3 [heading](#highlight.tags.heading).
      */heading3:t(heading),/**
      A level 4 [heading](#highlight.tags.heading).
      */heading4:t(heading),/**
      A level 5 [heading](#highlight.tags.heading).
      */heading5:t(heading),/**
      A level 6 [heading](#highlight.tags.heading).
      */heading6:t(heading),/**
      A prose [content](#highlight.tags.content) separator (such as a horizontal rule).
      */contentSeparator:t(content),/**
      [Content](#highlight.tags.content) that represents a list.
      */list:t(content),/**
      [Content](#highlight.tags.content) that represents a quote.
      */quote:t(content),/**
      [Content](#highlight.tags.content) that is emphasized.
      */emphasis:t(content),/**
      [Content](#highlight.tags.content) that is styled strong.
      */strong:t(content),/**
      [Content](#highlight.tags.content) that is part of a link.
      */link:t(content),/**
      [Content](#highlight.tags.content) that is styled as code or
      monospace.
      */monospace:t(content),/**
      [Content](#highlight.tags.content) that has a strike-through
      style.
      */strikethrough:t(content),/**
      Inserted text in a change-tracking format.
      */inserted:t(),/**
      Deleted text.
      */deleted:t(),/**
      Changed text.
      */changed:t(),/**
      An invalid or unsyntactic element.
      */invalid:t(),/**
      Metadata or meta-instruction.
      */meta,/**
      [Metadata](#highlight.tags.meta) that applies to the entire
      document.
      */documentMeta:t(meta),/**
      [Metadata](#highlight.tags.meta) that annotates or adds
      attributes to a given syntactic element.
      */annotation:t(meta),/**
      Processing instruction or preprocessor directive. Subtag of
      [meta](#highlight.tags.meta).
      */processingInstruction:t(meta),/**
      [Modifier](#highlight.Tag^defineModifier) that indicates that a
      given element is being defined. Expected to be used with the
      various [name](#highlight.tags.name) tags.
      */definition:Tag.defineModifier("definition"),/**
      [Modifier](#highlight.Tag^defineModifier) that indicates that
      something is constant. Mostly expected to be used with
      [variable names](#highlight.tags.variableName).
      */constant:Tag.defineModifier("constant"),/**
      [Modifier](#highlight.Tag^defineModifier) used to indicate that
      a [variable](#highlight.tags.variableName) or [property
      name](#highlight.tags.propertyName) is being called or defined
      as a function.
      */function:Tag.defineModifier("function"),/**
      [Modifier](#highlight.Tag^defineModifier) that can be applied to
      [names](#highlight.tags.name) to indicate that they belong to
      the language's standard environment.
      */standard:Tag.defineModifier("standard"),/**
      [Modifier](#highlight.Tag^defineModifier) that indicates a given
      [names](#highlight.tags.name) is local to some scope.
      */local:Tag.defineModifier("local"),/**
      A generic variant [modifier](#highlight.Tag^defineModifier) that
      can be used to tag language-specific alternative variants of
      some common tag. It is recommended for themes to define special
      forms of at least the [string](#highlight.tags.string) and
      [variable name](#highlight.tags.variableName) tags, since those
      come up a lot.
      */special:Tag.defineModifier("special")};for(let name in tags$1){let val=tags$1[name];if(val instanceof Tag)val.name=name;}/**
  This is a highlighter that adds stable, predictable classes to
  tokens, for styling with external CSS.

  The following tags are mapped to their name prefixed with `"tok-"`
  (for example `"tok-comment"`):

  * [`link`](#highlight.tags.link)
  * [`heading`](#highlight.tags.heading)
  * [`emphasis`](#highlight.tags.emphasis)
  * [`strong`](#highlight.tags.strong)
  * [`keyword`](#highlight.tags.keyword)
  * [`atom`](#highlight.tags.atom)
  * [`bool`](#highlight.tags.bool)
  * [`url`](#highlight.tags.url)
  * [`labelName`](#highlight.tags.labelName)
  * [`inserted`](#highlight.tags.inserted)
  * [`deleted`](#highlight.tags.deleted)
  * [`literal`](#highlight.tags.literal)
  * [`string`](#highlight.tags.string)
  * [`number`](#highlight.tags.number)
  * [`variableName`](#highlight.tags.variableName)
  * [`typeName`](#highlight.tags.typeName)
  * [`namespace`](#highlight.tags.namespace)
  * [`className`](#highlight.tags.className)
  * [`macroName`](#highlight.tags.macroName)
  * [`propertyName`](#highlight.tags.propertyName)
  * [`operator`](#highlight.tags.operator)
  * [`comment`](#highlight.tags.comment)
  * [`meta`](#highlight.tags.meta)
  * [`punctuation`](#highlight.tags.punctuation)
  * [`invalid`](#highlight.tags.invalid)

  In addition, these mappings are provided:

  * [`regexp`](#highlight.tags.regexp),
    [`escape`](#highlight.tags.escape), and
    [`special`](#highlight.tags.special)[`(string)`](#highlight.tags.string)
    are mapped to `"tok-string2"`
  * [`special`](#highlight.tags.special)[`(variableName)`](#highlight.tags.variableName)
    to `"tok-variableName2"`
  * [`local`](#highlight.tags.local)[`(variableName)`](#highlight.tags.variableName)
    to `"tok-variableName tok-local"`
  * [`definition`](#highlight.tags.definition)[`(variableName)`](#highlight.tags.variableName)
    to `"tok-variableName tok-definition"`
  * [`definition`](#highlight.tags.definition)[`(propertyName)`](#highlight.tags.propertyName)
    to `"tok-propertyName tok-definition"`
  */tagHighlighter([{tag:tags$1.link,class:"tok-link"},{tag:tags$1.heading,class:"tok-heading"},{tag:tags$1.emphasis,class:"tok-emphasis"},{tag:tags$1.strong,class:"tok-strong"},{tag:tags$1.keyword,class:"tok-keyword"},{tag:tags$1.atom,class:"tok-atom"},{tag:tags$1.bool,class:"tok-bool"},{tag:tags$1.url,class:"tok-url"},{tag:tags$1.labelName,class:"tok-labelName"},{tag:tags$1.inserted,class:"tok-inserted"},{tag:tags$1.deleted,class:"tok-deleted"},{tag:tags$1.literal,class:"tok-literal"},{tag:tags$1.string,class:"tok-string"},{tag:tags$1.number,class:"tok-number"},{tag:[tags$1.regexp,tags$1.escape,tags$1.special(tags$1.string)],class:"tok-string2"},{tag:tags$1.variableName,class:"tok-variableName"},{tag:tags$1.local(tags$1.variableName),class:"tok-variableName tok-local"},{tag:tags$1.definition(tags$1.variableName),class:"tok-variableName tok-definition"},{tag:tags$1.special(tags$1.variableName),class:"tok-variableName2"},{tag:tags$1.definition(tags$1.propertyName),class:"tok-propertyName tok-definition"},{tag:tags$1.typeName,class:"tok-typeName"},{tag:tags$1.namespace,class:"tok-namespace"},{tag:tags$1.className,class:"tok-className"},{tag:tags$1.macroName,class:"tok-macroName"},{tag:tags$1.propertyName,class:"tok-propertyName"},{tag:tags$1.operator,class:"tok-operator"},{tag:tags$1.comment,class:"tok-comment"},{tag:tags$1.meta,class:"tok-meta"},{tag:tags$1.invalid,class:"tok-invalid"},{tag:tags$1.punctuation,class:"tok-punctuation"}]);var _a;/**
  Node prop stored in a parser's top syntax node to provide the
  facet that stores language-specific data for that language.
  */const languageDataProp=/*@__PURE__*/new NodeProp();/**
  Helper function to define a facet (to be added to the top syntax
  node(s) for a language via
  [`languageDataProp`](https://codemirror.net/6/docs/ref/#language.languageDataProp)), that will be
  used to associate language data with the language. You
  probably only need this when subclassing
  [`Language`](https://codemirror.net/6/docs/ref/#language.Language).
  */function defineLanguageFacet(baseData){return Facet.define({combine:baseData?values=>values.concat(baseData):undefined});}/**
  Syntax node prop used to register sublanguages. Should be added to
  the top level node type for the language.
  */const sublanguageProp=/*@__PURE__*/new NodeProp();/**
  A language object manages parsing and per-language
  [metadata](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt). Parse data is
  managed as a [Lezer](https://lezer.codemirror.net) tree. The class
  can be used directly, via the [`LRLanguage`](https://codemirror.net/6/docs/ref/#language.LRLanguage)
  subclass for [Lezer](https://lezer.codemirror.net/) LR parsers, or
  via the [`StreamLanguage`](https://codemirror.net/6/docs/ref/#language.StreamLanguage) subclass
  for stream parsers.
  */class Language{/**
      Construct a language object. If you need to invoke this
      directly, first define a data facet with
      [`defineLanguageFacet`](https://codemirror.net/6/docs/ref/#language.defineLanguageFacet), and then
      configure your parser to [attach](https://codemirror.net/6/docs/ref/#language.languageDataProp) it
      to the language's outer syntax node.
      */constructor(/**
      The [language data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt) facet
      used for this language.
      */data,parser,extraExtensions=[],/**
      A language name.
      */name=""){this.data=data;this.name=name;// Kludge to define EditorState.tree as a debugging helper,
// without the EditorState package actually knowing about
// languages and lezer trees.
if(!EditorState.prototype.hasOwnProperty("tree"))Object.defineProperty(EditorState.prototype,"tree",{get(){return syntaxTree(this);}});this.parser=parser;this.extension=[language.of(this),EditorState.languageData.of((state,pos,side)=>{let top=topNodeAt(state,pos,side),data=top.type.prop(languageDataProp);if(!data)return[];let base=state.facet(data),sub=top.type.prop(sublanguageProp);if(sub){let innerNode=top.resolve(pos-top.from,side);for(let sublang of sub)if(sublang.test(innerNode,state)){let data=state.facet(sublang.facet);return sublang.type=="replace"?data:data.concat(base);}}return base;})].concat(extraExtensions);}/**
      Query whether this language is active at the given position.
      */isActiveAt(state,pos,side=-1){return topNodeAt(state,pos,side).type.prop(languageDataProp)==this.data;}/**
      Find the document regions that were parsed using this language.
      The returned regions will _include_ any nested languages rooted
      in this language, when those exist.
      */findRegions(state){let lang=state.facet(language);if((lang===null||lang===void 0?void 0:lang.data)==this.data)return[{from:0,to:state.doc.length}];if(!lang||!lang.allowsNesting)return[];let result=[];let explore=(tree,from)=>{if(tree.prop(languageDataProp)==this.data){result.push({from,to:from+tree.length});return;}let mount=tree.prop(NodeProp.mounted);if(mount){if(mount.tree.prop(languageDataProp)==this.data){if(mount.overlay)for(let r of mount.overlay)result.push({from:r.from+from,to:r.to+from});else result.push({from:from,to:from+tree.length});return;}else if(mount.overlay){let size=result.length;explore(mount.tree,mount.overlay[0].from+from);if(result.length>size)return;}}for(let i=0;i<tree.children.length;i++){let ch=tree.children[i];if(ch instanceof Tree)explore(ch,tree.positions[i]+from);}};explore(syntaxTree(state),0);return result;}/**
      Indicates whether this language allows nested languages. The
      default implementation returns true.
      */get allowsNesting(){return true;}}/**
  @internal
  */Language.setState=/*@__PURE__*/StateEffect.define();function topNodeAt(state,pos,side){let topLang=state.facet(language),tree=syntaxTree(state).topNode;if(!topLang||topLang.allowsNesting){for(let node=tree;node;node=node.enter(pos,side,IterMode.ExcludeBuffers))if(node.type.isTop)tree=node;}return tree;}/**
  A subclass of [`Language`](https://codemirror.net/6/docs/ref/#language.Language) for use with Lezer
  [LR parsers](https://lezer.codemirror.net/docs/ref#lr.LRParser)
  parsers.
  */class LRLanguage extends Language{constructor(data,parser,name){super(data,parser,[],name);this.parser=parser;}/**
      Define a language from a parser.
      */static define(spec){let data=defineLanguageFacet(spec.languageData);return new LRLanguage(data,spec.parser.configure({props:[languageDataProp.add(type=>type.isTop?data:undefined)]}),spec.name);}/**
      Create a new instance of this language with a reconfigured
      version of its parser and optionally a new name.
      */configure(options,name){return new LRLanguage(this.data,this.parser.configure(options),name||this.name);}get allowsNesting(){return this.parser.hasWrappers();}}/**
  Get the syntax tree for a state, which is the current (possibly
  incomplete) parse tree of the active
  [language](https://codemirror.net/6/docs/ref/#language.Language), or the empty tree if there is no
  language available.
  */function syntaxTree(state){let field=state.field(Language.state,false);return field?field.tree:Tree.empty;}/**
  Lezer-style
  [`Input`](https://lezer.codemirror.net/docs/ref#common.Input)
  object for a [`Text`](https://codemirror.net/6/docs/ref/#state.Text) object.
  */class DocInput{/**
      Create an input object for the given document.
      */constructor(doc){this.doc=doc;this.cursorPos=0;this.string="";this.cursor=doc.iter();}get length(){return this.doc.length;}syncTo(pos){this.string=this.cursor.next(pos-this.cursorPos).value;this.cursorPos=pos+this.string.length;return this.cursorPos-this.string.length;}chunk(pos){this.syncTo(pos);return this.string;}get lineChunks(){return true;}read(from,to){let stringStart=this.cursorPos-this.string.length;if(from<stringStart||to>=this.cursorPos)return this.doc.sliceString(from,to);else return this.string.slice(from-stringStart,to-stringStart);}}let currentContext=null;/**
  A parse context provided to parsers working on the editor content.
  */class ParseContext{constructor(parser,/**
      The current editor state.
      */state,/**
      Tree fragments that can be reused by incremental re-parses.
      */fragments=[],/**
      @internal
      */tree,/**
      @internal
      */treeLen,/**
      The current editor viewport (or some overapproximation
      thereof). Intended to be used for opportunistically avoiding
      work (in which case
      [`skipUntilInView`](https://codemirror.net/6/docs/ref/#language.ParseContext.skipUntilInView)
      should be called to make sure the parser is restarted when the
      skipped region becomes visible).
      */viewport,/**
      @internal
      */skipped,/**
      This is where skipping parsers can register a promise that,
      when resolved, will schedule a new parse. It is cleared when
      the parse worker picks up the promise. @internal
      */scheduleOn){this.parser=parser;this.state=state;this.fragments=fragments;this.tree=tree;this.treeLen=treeLen;this.viewport=viewport;this.skipped=skipped;this.scheduleOn=scheduleOn;this.parse=null;/**
          @internal
          */this.tempSkipped=[];}/**
      @internal
      */static create(parser,state,viewport){return new ParseContext(parser,state,[],Tree.empty,0,viewport,[],null);}startParse(){return this.parser.startParse(new DocInput(this.state.doc),this.fragments);}/**
      @internal
      */work(until,upto){if(upto!=null&&upto>=this.state.doc.length)upto=undefined;if(this.tree!=Tree.empty&&this.isDone(upto!==null&&upto!==void 0?upto:this.state.doc.length)){this.takeTree();return true;}return this.withContext(()=>{var _a;if(typeof until=="number"){let endTime=Date.now()+until;until=()=>Date.now()>endTime;}if(!this.parse)this.parse=this.startParse();if(upto!=null&&(this.parse.stoppedAt==null||this.parse.stoppedAt>upto)&&upto<this.state.doc.length)this.parse.stopAt(upto);for(;;){let done=this.parse.advance();if(done){this.fragments=this.withoutTempSkipped(TreeFragment.addTree(done,this.fragments,this.parse.stoppedAt!=null));this.treeLen=(_a=this.parse.stoppedAt)!==null&&_a!==void 0?_a:this.state.doc.length;this.tree=done;this.parse=null;if(this.treeLen<(upto!==null&&upto!==void 0?upto:this.state.doc.length))this.parse=this.startParse();else return true;}if(until())return false;}});}/**
      @internal
      */takeTree(){let pos,tree;if(this.parse&&(pos=this.parse.parsedPos)>=this.treeLen){if(this.parse.stoppedAt==null||this.parse.stoppedAt>pos)this.parse.stopAt(pos);this.withContext(()=>{while(!(tree=this.parse.advance())){}});this.treeLen=pos;this.tree=tree;this.fragments=this.withoutTempSkipped(TreeFragment.addTree(this.tree,this.fragments,true));this.parse=null;}}withContext(f){let prev=currentContext;currentContext=this;try{return f();}finally{currentContext=prev;}}withoutTempSkipped(fragments){for(let r;r=this.tempSkipped.pop();)fragments=cutFragments(fragments,r.from,r.to);return fragments;}/**
      @internal
      */changes(changes,newState){let{fragments,tree,treeLen,viewport,skipped}=this;this.takeTree();if(!changes.empty){let ranges=[];changes.iterChangedRanges((fromA,toA,fromB,toB)=>ranges.push({fromA,toA,fromB,toB}));fragments=TreeFragment.applyChanges(fragments,ranges);tree=Tree.empty;treeLen=0;viewport={from:changes.mapPos(viewport.from,-1),to:changes.mapPos(viewport.to,1)};if(this.skipped.length){skipped=[];for(let r of this.skipped){let from=changes.mapPos(r.from,1),to=changes.mapPos(r.to,-1);if(from<to)skipped.push({from,to});}}}return new ParseContext(this.parser,newState,fragments,tree,treeLen,viewport,skipped,this.scheduleOn);}/**
      @internal
      */updateViewport(viewport){if(this.viewport.from==viewport.from&&this.viewport.to==viewport.to)return false;this.viewport=viewport;let startLen=this.skipped.length;for(let i=0;i<this.skipped.length;i++){let{from,to}=this.skipped[i];if(from<viewport.to&&to>viewport.from){this.fragments=cutFragments(this.fragments,from,to);this.skipped.splice(i--,1);}}if(this.skipped.length>=startLen)return false;this.reset();return true;}/**
      @internal
      */reset(){if(this.parse){this.takeTree();this.parse=null;}}/**
      Notify the parse scheduler that the given region was skipped
      because it wasn't in view, and the parse should be restarted
      when it comes into view.
      */skipUntilInView(from,to){this.skipped.push({from,to});}/**
      Returns a parser intended to be used as placeholder when
      asynchronously loading a nested parser. It'll skip its input and
      mark it as not-really-parsed, so that the next update will parse
      it again.
      
      When `until` is given, a reparse will be scheduled when that
      promise resolves.
      */static getSkippingParser(until){return new class extends Parser{createParse(input,fragments,ranges){let from=ranges[0].from,to=ranges[ranges.length-1].to;let parser={parsedPos:from,advance(){let cx=currentContext;if(cx){for(let r of ranges)cx.tempSkipped.push(r);if(until)cx.scheduleOn=cx.scheduleOn?Promise.all([cx.scheduleOn,until]):until;}this.parsedPos=to;return new Tree(NodeType.none,[],[],to-from);},stoppedAt:null,stopAt(){}};return parser;}}();}/**
      @internal
      */isDone(upto){upto=Math.min(upto,this.state.doc.length);let frags=this.fragments;return this.treeLen>=upto&&frags.length&&frags[0].from==0&&frags[0].to>=upto;}/**
      Get the context for the current parse, or `null` if no editor
      parse is in progress.
      */static get(){return currentContext;}}function cutFragments(fragments,from,to){return TreeFragment.applyChanges(fragments,[{fromA:from,toA:to,fromB:from,toB:to}]);}class LanguageState{constructor(// A mutable parse state that is used to preserve work done during
// the lifetime of a state when moving to the next state.
context){this.context=context;this.tree=context.tree;}apply(tr){if(!tr.docChanged&&this.tree==this.context.tree)return this;let newCx=this.context.changes(tr.changes,tr.state);// If the previous parse wasn't done, go forward only up to its
// end position or the end of the viewport, to avoid slowing down
// state updates with parse work beyond the viewport.
let upto=this.context.treeLen==tr.startState.doc.length?undefined:Math.max(tr.changes.mapPos(this.context.treeLen),newCx.viewport.to);if(!newCx.work(20/* Work.Apply */,upto))newCx.takeTree();return new LanguageState(newCx);}static init(state){let vpTo=Math.min(3000/* Work.InitViewport */,state.doc.length);let parseState=ParseContext.create(state.facet(language).parser,state,{from:0,to:vpTo});if(!parseState.work(20/* Work.Apply */,vpTo))parseState.takeTree();return new LanguageState(parseState);}}Language.state=/*@__PURE__*/StateField.define({create:LanguageState.init,update(value,tr){for(let e of tr.effects)if(e.is(Language.setState))return e.value;if(tr.startState.facet(language)!=tr.state.facet(language))return LanguageState.init(tr.state);return value.apply(tr);}});let requestIdle=callback=>{let timeout=setTimeout(()=>callback(),500/* Work.MaxPause */);return()=>clearTimeout(timeout);};if(typeof requestIdleCallback!="undefined")requestIdle=callback=>{let idle=-1,timeout=setTimeout(()=>{idle=requestIdleCallback(callback,{timeout:500/* Work.MaxPause */-100/* Work.MinPause */});},100/* Work.MinPause */);return()=>idle<0?clearTimeout(timeout):cancelIdleCallback(idle);};const isInputPending=typeof navigator!="undefined"&&((_a=navigator.scheduling)===null||_a===void 0?void 0:_a.isInputPending)?()=>navigator.scheduling.isInputPending():null;const parseWorker=/*@__PURE__*/ViewPlugin.fromClass(class ParseWorker{constructor(view){this.view=view;this.working=null;this.workScheduled=0;// End of the current time chunk
this.chunkEnd=-1;// Milliseconds of budget left for this chunk
this.chunkBudget=-1;this.work=this.work.bind(this);this.scheduleWork();}update(update){let cx=this.view.state.field(Language.state).context;if(cx.updateViewport(update.view.viewport)||this.view.viewport.to>cx.treeLen)this.scheduleWork();if(update.docChanged||update.selectionSet){if(this.view.hasFocus)this.chunkBudget+=50/* Work.ChangeBonus */;this.scheduleWork();}this.checkAsyncSchedule(cx);}scheduleWork(){if(this.working)return;let{state}=this.view,field=state.field(Language.state);if(field.tree!=field.context.tree||!field.context.isDone(state.doc.length))this.working=requestIdle(this.work);}work(deadline){this.working=null;let now=Date.now();if(this.chunkEnd<now&&(this.chunkEnd<0||this.view.hasFocus)){// Start a new chunk
this.chunkEnd=now+30000/* Work.ChunkTime */;this.chunkBudget=3000/* Work.ChunkBudget */;}if(this.chunkBudget<=0)return;// No more budget
let{state,viewport:{to:vpTo}}=this.view,field=state.field(Language.state);if(field.tree==field.context.tree&&field.context.isDone(vpTo+100000/* Work.MaxParseAhead */))return;let endTime=Date.now()+Math.min(this.chunkBudget,100/* Work.Slice */,deadline&&!isInputPending?Math.max(25/* Work.MinSlice */,deadline.timeRemaining()-5):1e9);let viewportFirst=field.context.treeLen<vpTo&&state.doc.length>vpTo+1000;let done=field.context.work(()=>{return isInputPending&&isInputPending()||Date.now()>endTime;},vpTo+(viewportFirst?0:100000/* Work.MaxParseAhead */));this.chunkBudget-=Date.now()-now;if(done||this.chunkBudget<=0){field.context.takeTree();this.view.dispatch({effects:Language.setState.of(new LanguageState(field.context))});}if(this.chunkBudget>0&&!(done&&!viewportFirst))this.scheduleWork();this.checkAsyncSchedule(field.context);}checkAsyncSchedule(cx){if(cx.scheduleOn){this.workScheduled++;cx.scheduleOn.then(()=>this.scheduleWork()).catch(err=>logException(this.view.state,err)).then(()=>this.workScheduled--);cx.scheduleOn=null;}}destroy(){if(this.working)this.working();}isWorking(){return!!(this.working||this.workScheduled>0);}},{eventHandlers:{focus(){this.scheduleWork();}}});/**
  The facet used to associate a language with an editor state. Used
  by `Language` object's `extension` property (so you don't need to
  manually wrap your languages in this). Can be used to access the
  current language on a state.
  */const language=/*@__PURE__*/Facet.define({combine(languages){return languages.length?languages[0]:null;},enables:language=>[Language.state,parseWorker,EditorView.contentAttributes.compute([language],state=>{let lang=state.facet(language);return lang&&lang.name?{"data-language":lang.name}:{};})]});/**
  This class bundles a [language](https://codemirror.net/6/docs/ref/#language.Language) with an
  optional set of supporting extensions. Language packages are
  encouraged to export a function that optionally takes a
  configuration object and returns a `LanguageSupport` instance, as
  the main way for client code to use the package.
  */class LanguageSupport{/**
      Create a language support object.
      */constructor(/**
      The language object.
      */language,/**
      An optional set of supporting extensions. When nesting a
      language in another language, the outer language is encouraged
      to include the supporting extensions for its inner languages
      in its own set of support extensions.
      */support=[]){this.language=language;this.support=support;this.extension=[language,support];}}/**
  Facet that defines a way to provide a function that computes the
  appropriate indentation depth, as a column number (see
  [`indentString`](https://codemirror.net/6/docs/ref/#language.indentString)), at the start of a given
  line. A return value of `null` indicates no indentation can be
  determined, and the line should inherit the indentation of the one
  above it. A return value of `undefined` defers to the next indent
  service.
  */const indentService=/*@__PURE__*/Facet.define();/**
  Facet for overriding the unit by which indentation happens. Should
  be a string consisting either entirely of the same whitespace
  character. When not set, this defaults to 2 spaces.
  */const indentUnit=/*@__PURE__*/Facet.define({combine:values=>{if(!values.length)return"  ";let unit=values[0];if(!unit||/\S/.test(unit)||Array.from(unit).some(e=>e!=unit[0]))throw new Error("Invalid indent unit: "+JSON.stringify(values[0]));return unit;}});/**
  Return the _column width_ of an indent unit in the state.
  Determined by the [`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit)
  facet, and [`tabSize`](https://codemirror.net/6/docs/ref/#state.EditorState^tabSize) when that
  contains tabs.
  */function getIndentUnit(state){let unit=state.facet(indentUnit);return unit.charCodeAt(0)==9?state.tabSize*unit.length:unit.length;}/**
  Create an indentation string that covers columns 0 to `cols`.
  Will use tabs for as much of the columns as possible when the
  [`indentUnit`](https://codemirror.net/6/docs/ref/#language.indentUnit) facet contains
  tabs.
  */function indentString(state,cols){let result="",ts=state.tabSize,ch=state.facet(indentUnit)[0];if(ch=="\t"){while(cols>=ts){result+="\t";cols-=ts;}ch=" ";}for(let i=0;i<cols;i++)result+=ch;return result;}/**
  Get the indentation, as a column number, at the given position.
  Will first consult any [indent services](https://codemirror.net/6/docs/ref/#language.indentService)
  that are registered, and if none of those return an indentation,
  this will check the syntax tree for the [indent node
  prop](https://codemirror.net/6/docs/ref/#language.indentNodeProp) and use that if found. Returns a
  number when an indentation could be determined, and null
  otherwise.
  */function getIndentation(context,pos){if(context instanceof EditorState)context=new IndentContext(context);for(let service of context.state.facet(indentService)){let result=service(context,pos);if(result!==undefined)return result;}let tree=syntaxTree(context.state);return tree.length>=pos?syntaxIndentation(context,tree,pos):null;}/**
  Indentation contexts are used when calling [indentation
  services](https://codemirror.net/6/docs/ref/#language.indentService). They provide helper utilities
  useful in indentation logic, and can selectively override the
  indentation reported for some lines.
  */class IndentContext{/**
      Create an indent context.
      */constructor(/**
      The editor state.
      */state,/**
      @internal
      */options={}){this.state=state;this.options=options;this.unit=getIndentUnit(state);}/**
      Get a description of the line at the given position, taking
      [simulated line
      breaks](https://codemirror.net/6/docs/ref/#language.IndentContext.constructor^options.simulateBreak)
      into account. If there is such a break at `pos`, the `bias`
      argument determines whether the part of the line line before or
      after the break is used.
      */lineAt(pos,bias=1){let line=this.state.doc.lineAt(pos);let{simulateBreak,simulateDoubleBreak}=this.options;if(simulateBreak!=null&&simulateBreak>=line.from&&simulateBreak<=line.to){if(simulateDoubleBreak&&simulateBreak==pos)return{text:"",from:pos};else if(bias<0?simulateBreak<pos:simulateBreak<=pos)return{text:line.text.slice(simulateBreak-line.from),from:simulateBreak};else return{text:line.text.slice(0,simulateBreak-line.from),from:line.from};}return line;}/**
      Get the text directly after `pos`, either the entire line
      or the next 100 characters, whichever is shorter.
      */textAfterPos(pos,bias=1){if(this.options.simulateDoubleBreak&&pos==this.options.simulateBreak)return"";let{text,from}=this.lineAt(pos,bias);return text.slice(pos-from,Math.min(text.length,pos+100-from));}/**
      Find the column for the given position.
      */column(pos,bias=1){let{text,from}=this.lineAt(pos,bias);let result=this.countColumn(text,pos-from);let override=this.options.overrideIndentation?this.options.overrideIndentation(from):-1;if(override>-1)result+=override-this.countColumn(text,text.search(/\S|$/));return result;}/**
      Find the column position (taking tabs into account) of the given
      position in the given string.
      */countColumn(line,pos=line.length){return countColumn(line,this.state.tabSize,pos);}/**
      Find the indentation column of the line at the given point.
      */lineIndent(pos,bias=1){let{text,from}=this.lineAt(pos,bias);let override=this.options.overrideIndentation;if(override){let overriden=override(from);if(overriden>-1)return overriden;}return this.countColumn(text,text.search(/\S|$/));}/**
      Returns the [simulated line
      break](https://codemirror.net/6/docs/ref/#language.IndentContext.constructor^options.simulateBreak)
      for this context, if any.
      */get simulatedBreak(){return this.options.simulateBreak||null;}}/**
  A syntax tree node prop used to associate indentation strategies
  with node types. Such a strategy is a function from an indentation
  context to a column number (see also
  [`indentString`](https://codemirror.net/6/docs/ref/#language.indentString)) or null, where null
  indicates that no definitive indentation can be determined.
  */const indentNodeProp=/*@__PURE__*/new NodeProp();// Compute the indentation for a given position from the syntax tree.
function syntaxIndentation(cx,ast,pos){let stack=ast.resolveStack(pos);let inner=ast.resolveInner(pos,-1).resolve(pos,0).enterUnfinishedNodesBefore(pos);if(inner!=stack.node){let add=[];for(let cur=inner;cur&&!(cur.from==stack.node.from&&cur.type==stack.node.type);cur=cur.parent)add.push(cur);for(let i=add.length-1;i>=0;i--)stack={node:add[i],next:stack};}return indentFor(stack,cx,pos);}function indentFor(stack,cx,pos){for(let cur=stack;cur;cur=cur.next){let strategy=indentStrategy(cur.node);if(strategy)return strategy(TreeIndentContext.create(cx,pos,cur));}return 0;}function ignoreClosed(cx){return cx.pos==cx.options.simulateBreak&&cx.options.simulateDoubleBreak;}function indentStrategy(tree){let strategy=tree.type.prop(indentNodeProp);if(strategy)return strategy;let first=tree.firstChild,close;if(first&&(close=first.type.prop(NodeProp.closedBy))){let last=tree.lastChild,closed=last&&close.indexOf(last.name)>-1;return cx=>delimitedStrategy(cx,true,1,undefined,closed&&!ignoreClosed(cx)?last.from:undefined);}return tree.parent==null?topIndent:null;}function topIndent(){return 0;}/**
  Objects of this type provide context information and helper
  methods to indentation functions registered on syntax nodes.
  */class TreeIndentContext extends IndentContext{constructor(base,/**
      The position at which indentation is being computed.
      */pos,/**
      @internal
      */context){super(base.state,base.options);this.base=base;this.pos=pos;this.context=context;}/**
      The syntax tree node to which the indentation strategy
      applies.
      */get node(){return this.context.node;}/**
      @internal
      */static create(base,pos,context){return new TreeIndentContext(base,pos,context);}/**
      Get the text directly after `this.pos`, either the entire line
      or the next 100 characters, whichever is shorter.
      */get textAfter(){return this.textAfterPos(this.pos);}/**
      Get the indentation at the reference line for `this.node`, which
      is the line on which it starts, unless there is a node that is
      _not_ a parent of this node covering the start of that line. If
      so, the line at the start of that node is tried, again skipping
      on if it is covered by another such node.
      */get baseIndent(){return this.baseIndentFor(this.node);}/**
      Get the indentation for the reference line of the given node
      (see [`baseIndent`](https://codemirror.net/6/docs/ref/#language.TreeIndentContext.baseIndent)).
      */baseIndentFor(node){let line=this.state.doc.lineAt(node.from);// Skip line starts that are covered by a sibling (or cousin, etc)
for(;;){let atBreak=node.resolve(line.from);while(atBreak.parent&&atBreak.parent.from==atBreak.from)atBreak=atBreak.parent;if(isParent(atBreak,node))break;line=this.state.doc.lineAt(atBreak.from);}return this.lineIndent(line.from);}/**
      Continue looking for indentations in the node's parent nodes,
      and return the result of that.
      */continue(){return indentFor(this.context.next,this.base,this.pos);}}function isParent(parent,of){for(let cur=of;cur;cur=cur.parent)if(parent==cur)return true;return false;}// Check whether a delimited node is aligned (meaning there are
// non-skipped nodes on the same line as the opening delimiter). And
// if so, return the opening token.
function bracketedAligned(context){let tree=context.node;let openToken=tree.childAfter(tree.from),last=tree.lastChild;if(!openToken)return null;let sim=context.options.simulateBreak;let openLine=context.state.doc.lineAt(openToken.from);let lineEnd=sim==null||sim<=openLine.from?openLine.to:Math.min(openLine.to,sim);for(let pos=openToken.to;;){let next=tree.childAfter(pos);if(!next||next==last)return null;if(!next.type.isSkipped){if(next.from>=lineEnd)return null;let space=/^ */.exec(openLine.text.slice(openToken.to-openLine.from))[0].length;return{from:openToken.from,to:openToken.to+space};}pos=next.to;}}/**
  An indentation strategy for delimited (usually bracketed) nodes.
  Will, by default, indent one unit more than the parent's base
  indent unless the line starts with a closing token. When `align`
  is true and there are non-skipped nodes on the node's opening
  line, the content of the node will be aligned with the end of the
  opening node, like this:

      foo(bar,
          baz)
  */function delimitedIndent({closing,align=true,units=1}){return context=>delimitedStrategy(context,align,units,closing);}function delimitedStrategy(context,align,units,closing,closedAt){let after=context.textAfter,space=after.match(/^\s*/)[0].length;let closed=closing&&after.slice(space,space+closing.length)==closing||closedAt==context.pos+space;let aligned=align?bracketedAligned(context):null;if(aligned)return closed?context.column(aligned.from):context.column(aligned.to);return context.baseIndent+(closed?0:context.unit*units);}/**
  An indentation strategy that aligns a node's content to its base
  indentation.
  */const flatIndent=context=>context.baseIndent;/**
  Creates an indentation strategy that, by default, indents
  continued lines one unit more than the node's base indentation.
  You can provide `except` to prevent indentation of lines that
  match a pattern (for example `/^else\b/` in `if`/`else`
  constructs), and you can change the amount of units used with the
  `units` option.
  */function continuedIndent({except,units=1}={}){return context=>{let matchExcept=except&&except.test(context.textAfter);return context.baseIndent+(matchExcept?0:units*context.unit);};}const DontIndentBeyond=200;/**
  Enables reindentation on input. When a language defines an
  `indentOnInput` field in its [language
  data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt), which must hold a regular
  expression, the line at the cursor will be reindented whenever new
  text is typed and the input from the start of the line up to the
  cursor matches that regexp.

  To avoid unneccesary reindents, it is recommended to start the
  regexp with `^` (usually followed by `\s*`), and end it with `$`.
  For example, `/^\s*\}$/` will reindent when a closing brace is
  added at the start of a line.
  */function indentOnInput(){return EditorState.transactionFilter.of(tr=>{if(!tr.docChanged||!tr.isUserEvent("input.type")&&!tr.isUserEvent("input.complete"))return tr;let rules=tr.startState.languageDataAt("indentOnInput",tr.startState.selection.main.head);if(!rules.length)return tr;let doc=tr.newDoc,{head}=tr.newSelection.main,line=doc.lineAt(head);if(head>line.from+DontIndentBeyond)return tr;let lineStart=doc.sliceString(line.from,head);if(!rules.some(r=>r.test(lineStart)))return tr;let{state}=tr,last=-1,changes=[];for(let{head}of state.selection.ranges){let line=state.doc.lineAt(head);if(line.from==last)continue;last=line.from;let indent=getIndentation(state,line.from);if(indent==null)continue;let cur=/^\s*/.exec(line.text)[0];let norm=indentString(state,indent);if(cur!=norm)changes.push({from:line.from,to:line.from+cur.length,insert:norm});}return changes.length?[tr,{changes,sequential:true}]:tr;});}/**
  A facet that registers a code folding service. When called with
  the extent of a line, such a function should return a foldable
  range that starts on that line (but continues beyond it), if one
  can be found.
  */const foldService=/*@__PURE__*/Facet.define();/**
  This node prop is used to associate folding information with
  syntax node types. Given a syntax node, it should check whether
  that tree is foldable and return the range that can be collapsed
  when it is.
  */const foldNodeProp=/*@__PURE__*/new NodeProp();/**
  [Fold](https://codemirror.net/6/docs/ref/#language.foldNodeProp) function that folds everything but
  the first and the last child of a syntax node. Useful for nodes
  that start and end with delimiters.
  */function foldInside(node){let first=node.firstChild,last=node.lastChild;return first&&first.to<last.from?{from:first.to,to:last.type.isError?node.to:last.from}:null;}function syntaxFolding(state,start,end){let tree=syntaxTree(state);if(tree.length<end)return null;let stack=tree.resolveStack(end,1);let found=null;for(let iter=stack;iter;iter=iter.next){let cur=iter.node;if(cur.to<=end||cur.from>end)continue;if(found&&cur.from<start)break;let prop=cur.type.prop(foldNodeProp);if(prop&&(cur.to<tree.length-50||tree.length==state.doc.length||!isUnfinished(cur))){let value=prop(cur,state);if(value&&value.from<=end&&value.from>=start&&value.to>end)found=value;}}return found;}function isUnfinished(node){let ch=node.lastChild;return ch&&ch.to==node.to&&ch.type.isError;}/**
  Check whether the given line is foldable. First asks any fold
  services registered through
  [`foldService`](https://codemirror.net/6/docs/ref/#language.foldService), and if none of them return
  a result, tries to query the [fold node
  prop](https://codemirror.net/6/docs/ref/#language.foldNodeProp) of syntax nodes that cover the end
  of the line.
  */function foldable(state,lineStart,lineEnd){for(let service of state.facet(foldService)){let result=service(state,lineStart,lineEnd);if(result)return result;}return syntaxFolding(state,lineStart,lineEnd);}function mapRange(range,mapping){let from=mapping.mapPos(range.from,1),to=mapping.mapPos(range.to,-1);return from>=to?undefined:{from,to};}/**
  State effect that can be attached to a transaction to fold the
  given range. (You probably only need this in exceptional
  circumstances—usually you'll just want to let
  [`foldCode`](https://codemirror.net/6/docs/ref/#language.foldCode) and the [fold
  gutter](https://codemirror.net/6/docs/ref/#language.foldGutter) create the transactions.)
  */const foldEffect=/*@__PURE__*/StateEffect.define({map:mapRange});/**
  State effect that unfolds the given range (if it was folded).
  */const unfoldEffect=/*@__PURE__*/StateEffect.define({map:mapRange});function selectedLines(view){let lines=[];for(let{head}of view.state.selection.ranges){if(lines.some(l=>l.from<=head&&l.to>=head))continue;lines.push(view.lineBlockAt(head));}return lines;}/**
  The state field that stores the folded ranges (as a [decoration
  set](https://codemirror.net/6/docs/ref/#view.DecorationSet)). Can be passed to
  [`EditorState.toJSON`](https://codemirror.net/6/docs/ref/#state.EditorState.toJSON) and
  [`fromJSON`](https://codemirror.net/6/docs/ref/#state.EditorState^fromJSON) to serialize the fold
  state.
  */const foldState=/*@__PURE__*/StateField.define({create(){return Decoration.none;},update(folded,tr){folded=folded.map(tr.changes);for(let e of tr.effects){if(e.is(foldEffect)&&!foldExists(folded,e.value.from,e.value.to)){let{preparePlaceholder}=tr.state.facet(foldConfig);let widget=!preparePlaceholder?foldWidget:Decoration.replace({widget:new PreparedFoldWidget(preparePlaceholder(tr.state,e.value))});folded=folded.update({add:[widget.range(e.value.from,e.value.to)]});}else if(e.is(unfoldEffect)){folded=folded.update({filter:(from,to)=>e.value.from!=from||e.value.to!=to,filterFrom:e.value.from,filterTo:e.value.to});}}// Clear folded ranges that cover the selection head
if(tr.selection){let onSelection=false,{head}=tr.selection.main;folded.between(head,head,(a,b)=>{if(a<head&&b>head)onSelection=true;});if(onSelection)folded=folded.update({filterFrom:head,filterTo:head,filter:(a,b)=>b<=head||a>=head});}return folded;},provide:f=>EditorView.decorations.from(f),toJSON(folded,state){let ranges=[];folded.between(0,state.doc.length,(from,to)=>{ranges.push(from,to);});return ranges;},fromJSON(value){if(!Array.isArray(value)||value.length%2)throw new RangeError("Invalid JSON for fold state");let ranges=[];for(let i=0;i<value.length;){let from=value[i++],to=value[i++];if(typeof from!="number"||typeof to!="number")throw new RangeError("Invalid JSON for fold state");ranges.push(foldWidget.range(from,to));}return Decoration.set(ranges,true);}});function findFold(state,from,to){var _a;let found=null;(_a=state.field(foldState,false))===null||_a===void 0?void 0:_a.between(from,to,(from,to)=>{if(!found||found.from>from)found={from,to};});return found;}function foldExists(folded,from,to){let found=false;folded.between(from,from,(a,b)=>{if(a==from&&b==to)found=true;});return found;}function maybeEnable(state,other){return state.field(foldState,false)?other:other.concat(StateEffect.appendConfig.of(codeFolding()));}/**
  Fold the lines that are selected, if possible.
  */const foldCode=view=>{for(let line of selectedLines(view)){let range=foldable(view.state,line.from,line.to);if(range){view.dispatch({effects:maybeEnable(view.state,[foldEffect.of(range),announceFold(view,range)])});return true;}}return false;};/**
  Unfold folded ranges on selected lines.
  */const unfoldCode=view=>{if(!view.state.field(foldState,false))return false;let effects=[];for(let line of selectedLines(view)){let folded=findFold(view.state,line.from,line.to);if(folded)effects.push(unfoldEffect.of(folded),announceFold(view,folded,false));}if(effects.length)view.dispatch({effects});return effects.length>0;};function announceFold(view,range,fold=true){let lineFrom=view.state.doc.lineAt(range.from).number,lineTo=view.state.doc.lineAt(range.to).number;return EditorView.announce.of(`${view.state.phrase(fold?"Folded lines":"Unfolded lines")} ${lineFrom} ${view.state.phrase("to")} ${lineTo}.`);}/**
  Fold all top-level foldable ranges. Note that, in most cases,
  folding information will depend on the [syntax
  tree](https://codemirror.net/6/docs/ref/#language.syntaxTree), and folding everything may not work
  reliably when the document hasn't been fully parsed (either
  because the editor state was only just initialized, or because the
  document is so big that the parser decided not to parse it
  entirely).
  */const foldAll=view=>{let{state}=view,effects=[];for(let pos=0;pos<state.doc.length;){let line=view.lineBlockAt(pos),range=foldable(state,line.from,line.to);if(range)effects.push(foldEffect.of(range));pos=(range?view.lineBlockAt(range.to):line).to+1;}if(effects.length)view.dispatch({effects:maybeEnable(view.state,effects)});return!!effects.length;};/**
  Unfold all folded code.
  */const unfoldAll=view=>{let field=view.state.field(foldState,false);if(!field||!field.size)return false;let effects=[];field.between(0,view.state.doc.length,(from,to)=>{effects.push(unfoldEffect.of({from,to}));});view.dispatch({effects});return true;};/**
  Default fold-related key bindings.

   - Ctrl-Shift-[ (Cmd-Alt-[ on macOS): [`foldCode`](https://codemirror.net/6/docs/ref/#language.foldCode).
   - Ctrl-Shift-] (Cmd-Alt-] on macOS): [`unfoldCode`](https://codemirror.net/6/docs/ref/#language.unfoldCode).
   - Ctrl-Alt-[: [`foldAll`](https://codemirror.net/6/docs/ref/#language.foldAll).
   - Ctrl-Alt-]: [`unfoldAll`](https://codemirror.net/6/docs/ref/#language.unfoldAll).
  */const foldKeymap=[{key:"Ctrl-Shift-[",mac:"Cmd-Alt-[",run:foldCode},{key:"Ctrl-Shift-]",mac:"Cmd-Alt-]",run:unfoldCode},{key:"Ctrl-Alt-[",run:foldAll},{key:"Ctrl-Alt-]",run:unfoldAll}];const defaultConfig={placeholderDOM:null,preparePlaceholder:null,placeholderText:"…"};const foldConfig=/*@__PURE__*/Facet.define({combine(values){return combineConfig(values,defaultConfig);}});/**
  Create an extension that configures code folding.
  */function codeFolding(config){let result=[foldState,baseTheme$1$2];return result;}function widgetToDOM(view,prepared){let{state}=view,conf=state.facet(foldConfig);let onclick=event=>{let line=view.lineBlockAt(view.posAtDOM(event.target));let folded=findFold(view.state,line.from,line.to);if(folded)view.dispatch({effects:unfoldEffect.of(folded)});event.preventDefault();};if(conf.placeholderDOM)return conf.placeholderDOM(view,onclick,prepared);let element=document.createElement("span");element.textContent=conf.placeholderText;element.setAttribute("aria-label",state.phrase("folded code"));element.title=state.phrase("unfold");element.className="cm-foldPlaceholder";element.onclick=onclick;return element;}const foldWidget=/*@__PURE__*/Decoration.replace({widget:/*@__PURE__*/new class extends WidgetType{toDOM(view){return widgetToDOM(view,null);}}()});class PreparedFoldWidget extends WidgetType{constructor(value){super();this.value=value;}eq(other){return this.value==other.value;}toDOM(view){return widgetToDOM(view,this.value);}}const foldGutterDefaults={openText:"⌄",closedText:"›",markerDOM:null,domEventHandlers:{},foldingChanged:()=>false};class FoldMarker extends GutterMarker{constructor(config,open){super();this.config=config;this.open=open;}eq(other){return this.config==other.config&&this.open==other.open;}toDOM(view){if(this.config.markerDOM)return this.config.markerDOM(this.open);let span=document.createElement("span");span.textContent=this.open?this.config.openText:this.config.closedText;span.title=view.state.phrase(this.open?"Fold line":"Unfold line");return span;}}/**
  Create an extension that registers a fold gutter, which shows a
  fold status indicator before foldable lines (which can be clicked
  to fold or unfold the line).
  */function foldGutter(config={}){let fullConfig=Object.assign(Object.assign({},foldGutterDefaults),config);let canFold=new FoldMarker(fullConfig,true),canUnfold=new FoldMarker(fullConfig,false);let markers=ViewPlugin.fromClass(class{constructor(view){this.from=view.viewport.from;this.markers=this.buildMarkers(view);}update(update){if(update.docChanged||update.viewportChanged||update.startState.facet(language)!=update.state.facet(language)||update.startState.field(foldState,false)!=update.state.field(foldState,false)||syntaxTree(update.startState)!=syntaxTree(update.state)||fullConfig.foldingChanged(update))this.markers=this.buildMarkers(update.view);}buildMarkers(view){let builder=new RangeSetBuilder();for(let line of view.viewportLineBlocks){let mark=findFold(view.state,line.from,line.to)?canUnfold:foldable(view.state,line.from,line.to)?canFold:null;if(mark)builder.add(line.from,line.from,mark);}return builder.finish();}});let{domEventHandlers}=fullConfig;return[markers,gutter({class:"cm-foldGutter",markers(view){var _a;return((_a=view.plugin(markers))===null||_a===void 0?void 0:_a.markers)||RangeSet.empty;},initialSpacer(){return new FoldMarker(fullConfig,false);},domEventHandlers:Object.assign(Object.assign({},domEventHandlers),{click:(view,line,event)=>{if(domEventHandlers.click&&domEventHandlers.click(view,line,event))return true;let folded=findFold(view.state,line.from,line.to);if(folded){view.dispatch({effects:unfoldEffect.of(folded)});return true;}let range=foldable(view.state,line.from,line.to);if(range){view.dispatch({effects:foldEffect.of(range)});return true;}return false;}})}),codeFolding()];}const baseTheme$1$2=/*@__PURE__*/EditorView.baseTheme({".cm-foldPlaceholder":{backgroundColor:"#eee",border:"1px solid #ddd",color:"#888",borderRadius:".2em",margin:"0 1px",padding:"0 1px",cursor:"pointer"},".cm-foldGutter span":{padding:"0 1px",cursor:"pointer"}});/**
  A highlight style associates CSS styles with higlighting
  [tags](https://lezer.codemirror.net/docs/ref#highlight.Tag).
  */class HighlightStyle{constructor(/**
      The tag styles used to create this highlight style.
      */specs,options){this.specs=specs;let modSpec;function def(spec){let cls=StyleModule.newName();(modSpec||(modSpec=Object.create(null)))["."+cls]=spec;return cls;}const all=typeof options.all=="string"?options.all:options.all?def(options.all):undefined;const scopeOpt=options.scope;this.scope=scopeOpt instanceof Language?type=>type.prop(languageDataProp)==scopeOpt.data:scopeOpt?type=>type==scopeOpt:undefined;this.style=tagHighlighter(specs.map(style=>({tag:style.tag,class:style.class||def(Object.assign({},style,{tag:null}))})),{all}).style;this.module=modSpec?new StyleModule(modSpec):null;this.themeType=options.themeType;}/**
      Create a highlighter style that associates the given styles to
      the given tags. The specs must be objects that hold a style tag
      or array of tags in their `tag` property, and either a single
      `class` property providing a static CSS class (for highlighter
      that rely on external styling), or a
      [`style-mod`](https://github.com/marijnh/style-mod#documentation)-style
      set of CSS properties (which define the styling for those tags).
      
      The CSS rules created for a highlighter will be emitted in the
      order of the spec's properties. That means that for elements that
      have multiple tags associated with them, styles defined further
      down in the list will have a higher CSS precedence than styles
      defined earlier.
      */static define(specs,options){return new HighlightStyle(specs,options||{});}}const highlighterFacet=/*@__PURE__*/Facet.define();const fallbackHighlighter=/*@__PURE__*/Facet.define({combine(values){return values.length?[values[0]]:null;}});function getHighlighters(state){let main=state.facet(highlighterFacet);return main.length?main:state.facet(fallbackHighlighter);}/**
  Wrap a highlighter in an editor extension that uses it to apply
  syntax highlighting to the editor content.

  When multiple (non-fallback) styles are provided, the styling
  applied is the union of the classes they emit.
  */function syntaxHighlighting(highlighter,options){let ext=[treeHighlighter],themeType;if(highlighter instanceof HighlightStyle){if(highlighter.module)ext.push(EditorView.styleModule.of(highlighter.module));themeType=highlighter.themeType;}if(options===null||options===void 0?void 0:options.fallback)ext.push(fallbackHighlighter.of(highlighter));else if(themeType)ext.push(highlighterFacet.computeN([EditorView.darkTheme],state=>{return state.facet(EditorView.darkTheme)==(themeType=="dark")?[highlighter]:[];}));else ext.push(highlighterFacet.of(highlighter));return ext;}class TreeHighlighter{constructor(view){this.markCache=Object.create(null);this.tree=syntaxTree(view.state);this.decorations=this.buildDeco(view,getHighlighters(view.state));this.decoratedTo=view.viewport.to;}update(update){let tree=syntaxTree(update.state),highlighters=getHighlighters(update.state);let styleChange=highlighters!=getHighlighters(update.startState);let{viewport}=update.view,decoratedToMapped=update.changes.mapPos(this.decoratedTo,1);if(tree.length<viewport.to&&!styleChange&&tree.type==this.tree.type&&decoratedToMapped>=viewport.to){this.decorations=this.decorations.map(update.changes);this.decoratedTo=decoratedToMapped;}else if(tree!=this.tree||update.viewportChanged||styleChange){this.tree=tree;this.decorations=this.buildDeco(update.view,highlighters);this.decoratedTo=viewport.to;}}buildDeco(view,highlighters){if(!highlighters||!this.tree.length)return Decoration.none;let builder=new RangeSetBuilder();for(let{from,to}of view.visibleRanges){highlightTree(this.tree,highlighters,(from,to,style)=>{builder.add(from,to,this.markCache[style]||(this.markCache[style]=Decoration.mark({class:style})));},from,to);}return builder.finish();}}const treeHighlighter=/*@__PURE__*/Prec.high(/*@__PURE__*/ViewPlugin.fromClass(TreeHighlighter,{decorations:v=>v.decorations}));/**
  A default highlight style (works well with light themes).
  */const defaultHighlightStyle=/*@__PURE__*/HighlightStyle.define([{tag:tags$1.meta,color:"#404740"},{tag:tags$1.link,textDecoration:"underline"},{tag:tags$1.heading,textDecoration:"underline",fontWeight:"bold"},{tag:tags$1.emphasis,fontStyle:"italic"},{tag:tags$1.strong,fontWeight:"bold"},{tag:tags$1.strikethrough,textDecoration:"line-through"},{tag:tags$1.keyword,color:"#708"},{tag:[tags$1.atom,tags$1.bool,tags$1.url,tags$1.contentSeparator,tags$1.labelName],color:"#219"},{tag:[tags$1.literal,tags$1.inserted],color:"#164"},{tag:[tags$1.string,tags$1.deleted],color:"#a11"},{tag:[tags$1.regexp,tags$1.escape,/*@__PURE__*/tags$1.special(tags$1.string)],color:"#e40"},{tag:/*@__PURE__*/tags$1.definition(tags$1.variableName),color:"#00f"},{tag:/*@__PURE__*/tags$1.local(tags$1.variableName),color:"#30a"},{tag:[tags$1.typeName,tags$1.namespace],color:"#085"},{tag:tags$1.className,color:"#167"},{tag:[/*@__PURE__*/tags$1.special(tags$1.variableName),tags$1.macroName],color:"#256"},{tag:/*@__PURE__*/tags$1.definition(tags$1.propertyName),color:"#00c"},{tag:tags$1.comment,color:"#940"},{tag:tags$1.invalid,color:"#f00"}]);const baseTheme$3=/*@__PURE__*/EditorView.baseTheme({"&.cm-focused .cm-matchingBracket":{backgroundColor:"#328c8252"},"&.cm-focused .cm-nonmatchingBracket":{backgroundColor:"#bb555544"}});const DefaultScanDist=10000,DefaultBrackets="()[]{}";const bracketMatchingConfig=/*@__PURE__*/Facet.define({combine(configs){return combineConfig(configs,{afterCursor:true,brackets:DefaultBrackets,maxScanDistance:DefaultScanDist,renderMatch:defaultRenderMatch});}});const matchingMark=/*@__PURE__*/Decoration.mark({class:"cm-matchingBracket"}),nonmatchingMark=/*@__PURE__*/Decoration.mark({class:"cm-nonmatchingBracket"});function defaultRenderMatch(match){let decorations=[];let mark=match.matched?matchingMark:nonmatchingMark;decorations.push(mark.range(match.start.from,match.start.to));if(match.end)decorations.push(mark.range(match.end.from,match.end.to));return decorations;}const bracketMatchingState=/*@__PURE__*/StateField.define({create(){return Decoration.none;},update(deco,tr){if(!tr.docChanged&&!tr.selection)return deco;let decorations=[];let config=tr.state.facet(bracketMatchingConfig);for(let range of tr.state.selection.ranges){if(!range.empty)continue;let match=matchBrackets(tr.state,range.head,-1,config)||range.head>0&&matchBrackets(tr.state,range.head-1,1,config)||config.afterCursor&&(matchBrackets(tr.state,range.head,1,config)||range.head<tr.state.doc.length&&matchBrackets(tr.state,range.head+1,-1,config));if(match)decorations=decorations.concat(config.renderMatch(match,tr.state));}return Decoration.set(decorations,true);},provide:f=>EditorView.decorations.from(f)});const bracketMatchingUnique=[bracketMatchingState,baseTheme$3];/**
  Create an extension that enables bracket matching. Whenever the
  cursor is next to a bracket, that bracket and the one it matches
  are highlighted. Or, when no matching bracket is found, another
  highlighting style is used to indicate this.
  */function bracketMatching(config={}){return[bracketMatchingConfig.of(config),bracketMatchingUnique];}/**
  When larger syntax nodes, such as HTML tags, are marked as
  opening/closing, it can be a bit messy to treat the whole node as
  a matchable bracket. This node prop allows you to define, for such
  a node, a ‘handle’—the part of the node that is highlighted, and
  that the cursor must be on to activate highlighting in the first
  place.
  */const bracketMatchingHandle=/*@__PURE__*/new NodeProp();function matchingNodes(node,dir,brackets){let byProp=node.prop(dir<0?NodeProp.openedBy:NodeProp.closedBy);if(byProp)return byProp;if(node.name.length==1){let index=brackets.indexOf(node.name);if(index>-1&&index%2==(dir<0?1:0))return[brackets[index+dir]];}return null;}function findHandle(node){let hasHandle=node.type.prop(bracketMatchingHandle);return hasHandle?hasHandle(node.node):node;}/**
  Find the matching bracket for the token at `pos`, scanning
  direction `dir`. Only the `brackets` and `maxScanDistance`
  properties are used from `config`, if given. Returns null if no
  bracket was found at `pos`, or a match result otherwise.
  */function matchBrackets(state,pos,dir,config={}){let maxScanDistance=config.maxScanDistance||DefaultScanDist,brackets=config.brackets||DefaultBrackets;let tree=syntaxTree(state),node=tree.resolveInner(pos,dir);for(let cur=node;cur;cur=cur.parent){let matches=matchingNodes(cur.type,dir,brackets);if(matches&&cur.from<cur.to){let handle=findHandle(cur);if(handle&&(dir>0?pos>=handle.from&&pos<handle.to:pos>handle.from&&pos<=handle.to))return matchMarkedBrackets(state,pos,dir,cur,handle,matches,brackets);}}return matchPlainBrackets(state,pos,dir,tree,node.type,maxScanDistance,brackets);}function matchMarkedBrackets(_state,_pos,dir,token,handle,matching,brackets){let parent=token.parent,firstToken={from:handle.from,to:handle.to};let depth=0,cursor=parent===null||parent===void 0?void 0:parent.cursor();if(cursor&&(dir<0?cursor.childBefore(token.from):cursor.childAfter(token.to)))do{if(dir<0?cursor.to<=token.from:cursor.from>=token.to){if(depth==0&&matching.indexOf(cursor.type.name)>-1&&cursor.from<cursor.to){let endHandle=findHandle(cursor);return{start:firstToken,end:endHandle?{from:endHandle.from,to:endHandle.to}:undefined,matched:true};}else if(matchingNodes(cursor.type,dir,brackets)){depth++;}else if(matchingNodes(cursor.type,-dir,brackets)){if(depth==0){let endHandle=findHandle(cursor);return{start:firstToken,end:endHandle&&endHandle.from<endHandle.to?{from:endHandle.from,to:endHandle.to}:undefined,matched:false};}depth--;}}}while(dir<0?cursor.prevSibling():cursor.nextSibling());return{start:firstToken,matched:false};}function matchPlainBrackets(state,pos,dir,tree,tokenType,maxScanDistance,brackets){let startCh=dir<0?state.sliceDoc(pos-1,pos):state.sliceDoc(pos,pos+1);let bracket=brackets.indexOf(startCh);if(bracket<0||bracket%2==0!=dir>0)return null;let startToken={from:dir<0?pos-1:pos,to:dir>0?pos+1:pos};let iter=state.doc.iterRange(pos,dir>0?state.doc.length:0),depth=0;for(let distance=0;!iter.next().done&&distance<=maxScanDistance;){let text=iter.value;if(dir<0)distance+=text.length;let basePos=pos+distance*dir;for(let pos=dir>0?0:text.length-1,end=dir>0?text.length:-1;pos!=end;pos+=dir){let found=brackets.indexOf(text[pos]);if(found<0||tree.resolveInner(basePos+pos,1).type!=tokenType)continue;if(found%2==0==dir>0){depth++;}else if(depth==1){// Closing
return{start:startToken,end:{from:basePos+pos,to:basePos+pos+1},matched:found>>1==bracket>>1};}else{depth--;}}if(dir>0)distance+=text.length;}return iter.done?{start:startToken,matched:false}:null;}const noTokens=/*@__PURE__*/Object.create(null);const typeArray=[NodeType.none];const warned=[];// Cache of node types by name and tags
const byTag=/*@__PURE__*/Object.create(null);const defaultTable=/*@__PURE__*/Object.create(null);for(let[legacyName,name]of[["variable","variableName"],["variable-2","variableName.special"],["string-2","string.special"],["def","variableName.definition"],["tag","tagName"],["attribute","attributeName"],["type","typeName"],["builtin","variableName.standard"],["qualifier","modifier"],["error","invalid"],["header","heading"],["property","propertyName"]])defaultTable[legacyName]=/*@__PURE__*/createTokenType(noTokens,name);function warnForPart(part,msg){if(warned.indexOf(part)>-1)return;warned.push(part);void 0;}function createTokenType(extra,tagStr){let tags$1$1=[];for(let name of tagStr.split(" ")){let found=[];for(let part of name.split(".")){let value=extra[part]||tags$1[part];if(!value){warnForPart(part,`Unknown highlighting tag ${part}`);}else if(typeof value=="function"){if(!found.length)warnForPart(part,`Modifier ${part} used at start of tag`);else found=found.map(value);}else{if(found.length)warnForPart(part,`Tag ${part} used as modifier`);else found=Array.isArray(value)?value:[value];}}for(let tag of found)tags$1$1.push(tag);}if(!tags$1$1.length)return 0;let name=tagStr.replace(/ /g,"_"),key=name+" "+tags$1$1.map(t=>t.id);let known=byTag[key];if(known)return known.id;let type=byTag[key]=NodeType.define({id:typeArray.length,name,props:[styleTags({[name]:tags$1$1})]});typeArray.push(type);return type.id;}({rtl:/*@__PURE__*/Decoration.mark({class:"cm-iso",inclusive:true,attributes:{dir:"rtl"},bidiIsolate:Direction.RTL}),ltr:/*@__PURE__*/Decoration.mark({class:"cm-iso",inclusive:true,attributes:{dir:"ltr"},bidiIsolate:Direction.LTR})});/**
  Comment or uncomment the current selection. Will use line comments
  if available, otherwise falling back to block comments.
  */const toggleComment=target=>{let{state}=target,line=state.doc.lineAt(state.selection.main.from),config=getConfig(target.state,line.from);return config.line?toggleLineComment(target):config.block?toggleBlockCommentByLine(target):false;};function command(f,option){return({state,dispatch})=>{if(state.readOnly)return false;let tr=f(option,state);if(!tr)return false;dispatch(state.update(tr));return true;};}/**
  Comment or uncomment the current selection using line comments.
  The line comment syntax is taken from the
  [`commentTokens`](https://codemirror.net/6/docs/ref/#commands.CommentTokens) [language
  data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt).
  */const toggleLineComment=/*@__PURE__*/command(changeLineComment,0/* CommentOption.Toggle */);/**
  Comment or uncomment the current selection using block comments.
  The block comment syntax is taken from the
  [`commentTokens`](https://codemirror.net/6/docs/ref/#commands.CommentTokens) [language
  data](https://codemirror.net/6/docs/ref/#state.EditorState.languageDataAt).
  */const toggleBlockComment=/*@__PURE__*/command(changeBlockComment,0/* CommentOption.Toggle */);/**
  Comment or uncomment the lines around the current selection using
  block comments.
  */const toggleBlockCommentByLine=/*@__PURE__*/command((o,s)=>changeBlockComment(o,s,selectedLineRanges(s)),0/* CommentOption.Toggle */);function getConfig(state,pos){let data=state.languageDataAt("commentTokens",pos);return data.length?data[0]:{};}const SearchMargin=50;/**
  Determines if the given range is block-commented in the given
  state.
  */function findBlockComment(state,{open,close},from,to){let textBefore=state.sliceDoc(from-SearchMargin,from);let textAfter=state.sliceDoc(to,to+SearchMargin);let spaceBefore=/\s*$/.exec(textBefore)[0].length,spaceAfter=/^\s*/.exec(textAfter)[0].length;let beforeOff=textBefore.length-spaceBefore;if(textBefore.slice(beforeOff-open.length,beforeOff)==open&&textAfter.slice(spaceAfter,spaceAfter+close.length)==close){return{open:{pos:from-spaceBefore,margin:spaceBefore&&1},close:{pos:to+spaceAfter,margin:spaceAfter&&1}};}let startText,endText;if(to-from<=2*SearchMargin){startText=endText=state.sliceDoc(from,to);}else{startText=state.sliceDoc(from,from+SearchMargin);endText=state.sliceDoc(to-SearchMargin,to);}let startSpace=/^\s*/.exec(startText)[0].length,endSpace=/\s*$/.exec(endText)[0].length;let endOff=endText.length-endSpace-close.length;if(startText.slice(startSpace,startSpace+open.length)==open&&endText.slice(endOff,endOff+close.length)==close){return{open:{pos:from+startSpace+open.length,margin:/\s/.test(startText.charAt(startSpace+open.length))?1:0},close:{pos:to-endSpace-close.length,margin:/\s/.test(endText.charAt(endOff-1))?1:0}};}return null;}function selectedLineRanges(state){let ranges=[];for(let r of state.selection.ranges){let fromLine=state.doc.lineAt(r.from);let toLine=r.to<=fromLine.to?fromLine:state.doc.lineAt(r.to);let last=ranges.length-1;if(last>=0&&ranges[last].to>fromLine.from)ranges[last].to=toLine.to;else ranges.push({from:fromLine.from+/^\s*/.exec(fromLine.text)[0].length,to:toLine.to});}return ranges;}// Performs toggle, comment and uncomment of block comments in
// languages that support them.
function changeBlockComment(option,state,ranges=state.selection.ranges){let tokens=ranges.map(r=>getConfig(state,r.from).block);if(!tokens.every(c=>c))return null;let comments=ranges.map((r,i)=>findBlockComment(state,tokens[i],r.from,r.to));if(option!=2/* CommentOption.Uncomment */&&!comments.every(c=>c)){return{changes:state.changes(ranges.map((range,i)=>{if(comments[i])return[];return[{from:range.from,insert:tokens[i].open+" "},{from:range.to,insert:" "+tokens[i].close}];}))};}else if(option!=1/* CommentOption.Comment */&&comments.some(c=>c)){let changes=[];for(let i=0,comment;i<comments.length;i++)if(comment=comments[i]){let token=tokens[i],{open,close}=comment;changes.push({from:open.pos-token.open.length,to:open.pos+open.margin},{from:close.pos-close.margin,to:close.pos+token.close.length});}return{changes};}return null;}// Performs toggle, comment and uncomment of line comments.
function changeLineComment(option,state,ranges=state.selection.ranges){let lines=[];let prevLine=-1;for(let{from,to}of ranges){let startI=lines.length,minIndent=1e9;let token=getConfig(state,from).line;if(!token)continue;for(let pos=from;pos<=to;){let line=state.doc.lineAt(pos);if(line.from>prevLine&&(from==to||to>line.from)){prevLine=line.from;let indent=/^\s*/.exec(line.text)[0].length;let empty=indent==line.length;let comment=line.text.slice(indent,indent+token.length)==token?indent:-1;if(indent<line.text.length&&indent<minIndent)minIndent=indent;lines.push({line,comment,token,indent,empty,single:false});}pos=line.to+1;}if(minIndent<1e9)for(let i=startI;i<lines.length;i++)if(lines[i].indent<lines[i].line.text.length)lines[i].indent=minIndent;if(lines.length==startI+1)lines[startI].single=true;}if(option!=2/* CommentOption.Uncomment */&&lines.some(l=>l.comment<0&&(!l.empty||l.single))){let changes=[];for(let{line,token,indent,empty,single}of lines)if(single||!empty)changes.push({from:line.from+indent,insert:token+" "});let changeSet=state.changes(changes);return{changes:changeSet,selection:state.selection.map(changeSet,1)};}else if(option!=1/* CommentOption.Comment */&&lines.some(l=>l.comment>=0)){let changes=[];for(let{line,comment,token}of lines)if(comment>=0){let from=line.from+comment,to=from+token.length;if(line.text[to-line.from]==" ")to++;changes.push({from,to});}return{changes};}return null;}const fromHistory=/*@__PURE__*/Annotation.define();/**
  Transaction annotation that will prevent that transaction from
  being combined with other transactions in the undo history. Given
  `"before"`, it'll prevent merging with previous transactions. With
  `"after"`, subsequent transactions won't be combined with this
  one. With `"full"`, the transaction is isolated on both sides.
  */const isolateHistory=/*@__PURE__*/Annotation.define();/**
  This facet provides a way to register functions that, given a
  transaction, provide a set of effects that the history should
  store when inverting the transaction. This can be used to
  integrate some kinds of effects in the history, so that they can
  be undone (and redone again).
  */const invertedEffects=/*@__PURE__*/Facet.define();const historyConfig=/*@__PURE__*/Facet.define({combine(configs){return combineConfig(configs,{minDepth:100,newGroupDelay:500,joinToEvent:(_t,isAdjacent)=>isAdjacent},{minDepth:Math.max,newGroupDelay:Math.min,joinToEvent:(a,b)=>(tr,adj)=>a(tr,adj)||b(tr,adj)});}});const historyField_=/*@__PURE__*/StateField.define({create(){return HistoryState.empty;},update(state,tr){let config=tr.state.facet(historyConfig);let fromHist=tr.annotation(fromHistory);if(fromHist){let item=HistEvent.fromTransaction(tr,fromHist.selection),from=fromHist.side;let other=from==0/* BranchName.Done */?state.undone:state.done;if(item)other=updateBranch(other,other.length,config.minDepth,item);else other=addSelection(other,tr.startState.selection);return new HistoryState(from==0/* BranchName.Done */?fromHist.rest:other,from==0/* BranchName.Done */?other:fromHist.rest);}let isolate=tr.annotation(isolateHistory);if(isolate=="full"||isolate=="before")state=state.isolate();if(tr.annotation(Transaction.addToHistory)===false)return!tr.changes.empty?state.addMapping(tr.changes.desc):state;let event=HistEvent.fromTransaction(tr);let time=tr.annotation(Transaction.time),userEvent=tr.annotation(Transaction.userEvent);if(event)state=state.addChanges(event,time,userEvent,config,tr);else if(tr.selection)state=state.addSelection(tr.startState.selection,time,userEvent,config.newGroupDelay);if(isolate=="full"||isolate=="after")state=state.isolate();return state;},toJSON(value){return{done:value.done.map(e=>e.toJSON()),undone:value.undone.map(e=>e.toJSON())};},fromJSON(json){return new HistoryState(json.done.map(HistEvent.fromJSON),json.undone.map(HistEvent.fromJSON));}});/**
  Create a history extension with the given configuration.
  */function history(config={}){return[historyField_,historyConfig.of(config),EditorView.domEventHandlers({beforeinput(e,view){let command=e.inputType=="historyUndo"?undo:e.inputType=="historyRedo"?redo:null;if(!command)return false;e.preventDefault();return command(view);}})];}function cmd(side,selection){return function({state,dispatch}){if(!selection&&state.readOnly)return false;let historyState=state.field(historyField_,false);if(!historyState)return false;let tr=historyState.pop(side,state,selection);if(!tr)return false;dispatch(tr);return true;};}/**
  Undo a single group of history events. Returns false if no group
  was available.
  */const undo=/*@__PURE__*/cmd(0/* BranchName.Done */,false);/**
  Redo a group of history events. Returns false if no group was
  available.
  */const redo=/*@__PURE__*/cmd(1/* BranchName.Undone */,false);/**
  Undo a change or selection change.
  */const undoSelection=/*@__PURE__*/cmd(0/* BranchName.Done */,true);/**
  Redo a change or selection change.
  */const redoSelection=/*@__PURE__*/cmd(1/* BranchName.Undone */,true);// History events store groups of changes or effects that need to be
// undone/redone together.
class HistEvent{constructor(// The changes in this event. Normal events hold at least one
// change or effect. But it may be necessary to store selection
// events before the first change, in which case a special type of
// instance is created which doesn't hold any changes, with
// changes == startSelection == undefined
changes,// The effects associated with this event
effects,// Accumulated mapping (from addToHistory==false) that should be
// applied to events below this one.
mapped,// The selection before this event
startSelection,// Stores selection changes after this event, to be used for
// selection undo/redo.
selectionsAfter){this.changes=changes;this.effects=effects;this.mapped=mapped;this.startSelection=startSelection;this.selectionsAfter=selectionsAfter;}setSelAfter(after){return new HistEvent(this.changes,this.effects,this.mapped,this.startSelection,after);}toJSON(){var _a,_b,_c;return{changes:(_a=this.changes)===null||_a===void 0?void 0:_a.toJSON(),mapped:(_b=this.mapped)===null||_b===void 0?void 0:_b.toJSON(),startSelection:(_c=this.startSelection)===null||_c===void 0?void 0:_c.toJSON(),selectionsAfter:this.selectionsAfter.map(s=>s.toJSON())};}static fromJSON(json){return new HistEvent(json.changes&&ChangeSet.fromJSON(json.changes),[],json.mapped&&ChangeDesc.fromJSON(json.mapped),json.startSelection&&EditorSelection.fromJSON(json.startSelection),json.selectionsAfter.map(EditorSelection.fromJSON));}// This does not check `addToHistory` and such, it assumes the
// transaction needs to be converted to an item. Returns null when
// there are no changes or effects in the transaction.
static fromTransaction(tr,selection){let effects=none$1;for(let invert of tr.startState.facet(invertedEffects)){let result=invert(tr);if(result.length)effects=effects.concat(result);}if(!effects.length&&tr.changes.empty)return null;return new HistEvent(tr.changes.invert(tr.startState.doc),effects,undefined,selection||tr.startState.selection,none$1);}static selection(selections){return new HistEvent(undefined,none$1,undefined,undefined,selections);}}function updateBranch(branch,to,maxLen,newEvent){let start=to+1>maxLen+20?to-maxLen-1:0;let newBranch=branch.slice(start,to);newBranch.push(newEvent);return newBranch;}function isAdjacent(a,b){let ranges=[],isAdjacent=false;a.iterChangedRanges((f,t)=>ranges.push(f,t));b.iterChangedRanges((_f,_t,f,t)=>{for(let i=0;i<ranges.length;){let from=ranges[i++],to=ranges[i++];if(t>=from&&f<=to)isAdjacent=true;}});return isAdjacent;}function eqSelectionShape(a,b){return a.ranges.length==b.ranges.length&&a.ranges.filter((r,i)=>r.empty!=b.ranges[i].empty).length===0;}function conc(a,b){return!a.length?b:!b.length?a:a.concat(b);}const none$1=[];const MaxSelectionsPerEvent=200;function addSelection(branch,selection){if(!branch.length){return[HistEvent.selection([selection])];}else{let lastEvent=branch[branch.length-1];let sels=lastEvent.selectionsAfter.slice(Math.max(0,lastEvent.selectionsAfter.length-MaxSelectionsPerEvent));if(sels.length&&sels[sels.length-1].eq(selection))return branch;sels.push(selection);return updateBranch(branch,branch.length-1,1e9,lastEvent.setSelAfter(sels));}}// Assumes the top item has one or more selectionAfter values
function popSelection(branch){let last=branch[branch.length-1];let newBranch=branch.slice();newBranch[branch.length-1]=last.setSelAfter(last.selectionsAfter.slice(0,last.selectionsAfter.length-1));return newBranch;}// Add a mapping to the top event in the given branch. If this maps
// away all the changes and effects in that item, drop it and
// propagate the mapping to the next item.
function addMappingToBranch(branch,mapping){if(!branch.length)return branch;let length=branch.length,selections=none$1;while(length){let event=mapEvent(branch[length-1],mapping,selections);if(event.changes&&!event.changes.empty||event.effects.length){// Event survived mapping
let result=branch.slice(0,length);result[length-1]=event;return result;}else{// Drop this event, since there's no changes or effects left
mapping=event.mapped;length--;selections=event.selectionsAfter;}}return selections.length?[HistEvent.selection(selections)]:none$1;}function mapEvent(event,mapping,extraSelections){let selections=conc(event.selectionsAfter.length?event.selectionsAfter.map(s=>s.map(mapping)):none$1,extraSelections);// Change-less events don't store mappings (they are always the last event in a branch)
if(!event.changes)return HistEvent.selection(selections);let mappedChanges=event.changes.map(mapping),before=mapping.mapDesc(event.changes,true);let fullMapping=event.mapped?event.mapped.composeDesc(before):before;return new HistEvent(mappedChanges,StateEffect.mapEffects(event.effects,mapping),fullMapping,event.startSelection.map(before),selections);}const joinableUserEvent=/^(input\.type|delete)($|\.)/;class HistoryState{constructor(done,undone,prevTime=0,prevUserEvent=undefined){this.done=done;this.undone=undone;this.prevTime=prevTime;this.prevUserEvent=prevUserEvent;}isolate(){return this.prevTime?new HistoryState(this.done,this.undone):this;}addChanges(event,time,userEvent,config,tr){let done=this.done,lastEvent=done[done.length-1];if(lastEvent&&lastEvent.changes&&!lastEvent.changes.empty&&event.changes&&(!userEvent||joinableUserEvent.test(userEvent))&&(!lastEvent.selectionsAfter.length&&time-this.prevTime<config.newGroupDelay&&config.joinToEvent(tr,isAdjacent(lastEvent.changes,event.changes))||// For compose (but not compose.start) events, always join with previous event
userEvent=="input.type.compose")){done=updateBranch(done,done.length-1,config.minDepth,new HistEvent(event.changes.compose(lastEvent.changes),conc(event.effects,lastEvent.effects),lastEvent.mapped,lastEvent.startSelection,none$1));}else{done=updateBranch(done,done.length,config.minDepth,event);}return new HistoryState(done,none$1,time,userEvent);}addSelection(selection,time,userEvent,newGroupDelay){let last=this.done.length?this.done[this.done.length-1].selectionsAfter:none$1;if(last.length>0&&time-this.prevTime<newGroupDelay&&userEvent==this.prevUserEvent&&userEvent&&/^select($|\.)/.test(userEvent)&&eqSelectionShape(last[last.length-1],selection))return this;return new HistoryState(addSelection(this.done,selection),this.undone,time,userEvent);}addMapping(mapping){return new HistoryState(addMappingToBranch(this.done,mapping),addMappingToBranch(this.undone,mapping),this.prevTime,this.prevUserEvent);}pop(side,state,onlySelection){let branch=side==0/* BranchName.Done */?this.done:this.undone;if(branch.length==0)return null;let event=branch[branch.length-1],selection=event.selectionsAfter[0]||state.selection;if(onlySelection&&event.selectionsAfter.length){return state.update({selection:event.selectionsAfter[event.selectionsAfter.length-1],annotations:fromHistory.of({side,rest:popSelection(branch),selection}),userEvent:side==0/* BranchName.Done */?"select.undo":"select.redo",scrollIntoView:true});}else if(!event.changes){return null;}else{let rest=branch.length==1?none$1:branch.slice(0,branch.length-1);if(event.mapped)rest=addMappingToBranch(rest,event.mapped);return state.update({changes:event.changes,selection:event.startSelection,effects:event.effects,annotations:fromHistory.of({side,rest,selection}),filter:false,userEvent:side==0/* BranchName.Done */?"undo":"redo",scrollIntoView:true});}}}HistoryState.empty=/*@__PURE__*/new HistoryState(none$1,none$1);/**
  Default key bindings for the undo history.

  - Mod-z: [`undo`](https://codemirror.net/6/docs/ref/#commands.undo).
  - Mod-y (Mod-Shift-z on macOS) + Ctrl-Shift-z on Linux: [`redo`](https://codemirror.net/6/docs/ref/#commands.redo).
  - Mod-u: [`undoSelection`](https://codemirror.net/6/docs/ref/#commands.undoSelection).
  - Alt-u (Mod-Shift-u on macOS): [`redoSelection`](https://codemirror.net/6/docs/ref/#commands.redoSelection).
  */const historyKeymap=[{key:"Mod-z",run:undo,preventDefault:true},{key:"Mod-y",mac:"Mod-Shift-z",run:redo,preventDefault:true},{linux:"Ctrl-Shift-z",run:redo,preventDefault:true},{key:"Mod-u",run:undoSelection,preventDefault:true},{key:"Alt-u",mac:"Mod-Shift-u",run:redoSelection,preventDefault:true}];function updateSel(sel,by){return EditorSelection.create(sel.ranges.map(by),sel.mainIndex);}function setSel(state,selection){return state.update({selection,scrollIntoView:true,userEvent:"select"});}function moveSel({state,dispatch},how){let selection=updateSel(state.selection,how);if(selection.eq(state.selection,true))return false;dispatch(setSel(state,selection));return true;}function rangeEnd(range,forward){return EditorSelection.cursor(forward?range.to:range.from);}function cursorByChar(view,forward){return moveSel(view,range=>range.empty?view.moveByChar(range,forward):rangeEnd(range,forward));}function ltrAtCursor(view){return view.textDirectionAt(view.state.selection.main.head)==Direction.LTR;}/**
  Move the selection one character to the left (which is backward in
  left-to-right text, forward in right-to-left text).
  */const cursorCharLeft=view=>cursorByChar(view,!ltrAtCursor(view));/**
  Move the selection one character to the right.
  */const cursorCharRight=view=>cursorByChar(view,ltrAtCursor(view));function cursorByGroup(view,forward){return moveSel(view,range=>range.empty?view.moveByGroup(range,forward):rangeEnd(range,forward));}/**
  Move the selection to the left across one group of word or
  non-word (but also non-space) characters.
  */const cursorGroupLeft=view=>cursorByGroup(view,!ltrAtCursor(view));/**
  Move the selection one group to the right.
  */const cursorGroupRight=view=>cursorByGroup(view,ltrAtCursor(view));function interestingNode(state,node,bracketProp){if(node.type.prop(bracketProp))return true;let len=node.to-node.from;return len&&(len>2||/[^\s,.;:]/.test(state.sliceDoc(node.from,node.to)))||node.firstChild;}function moveBySyntax(state,start,forward){let pos=syntaxTree(state).resolveInner(start.head);let bracketProp=forward?NodeProp.closedBy:NodeProp.openedBy;// Scan forward through child nodes to see if there's an interesting
// node ahead.
for(let at=start.head;;){let next=forward?pos.childAfter(at):pos.childBefore(at);if(!next)break;if(interestingNode(state,next,bracketProp))pos=next;else at=forward?next.to:next.from;}let bracket=pos.type.prop(bracketProp),match,newPos;if(bracket&&(match=forward?matchBrackets(state,pos.from,1):matchBrackets(state,pos.to,-1))&&match.matched)newPos=forward?match.end.to:match.end.from;else newPos=forward?pos.to:pos.from;return EditorSelection.cursor(newPos,forward?-1:1);}/**
  Move the cursor over the next syntactic element to the left.
  */const cursorSyntaxLeft=view=>moveSel(view,range=>moveBySyntax(view.state,range,!ltrAtCursor(view)));/**
  Move the cursor over the next syntactic element to the right.
  */const cursorSyntaxRight=view=>moveSel(view,range=>moveBySyntax(view.state,range,ltrAtCursor(view)));function cursorByLine(view,forward){return moveSel(view,range=>{if(!range.empty)return rangeEnd(range,forward);let moved=view.moveVertically(range,forward);return moved.head!=range.head?moved:view.moveToLineBoundary(range,forward);});}/**
  Move the selection one line up.
  */const cursorLineUp=view=>cursorByLine(view,false);/**
  Move the selection one line down.
  */const cursorLineDown=view=>cursorByLine(view,true);function pageInfo(view){let selfScroll=view.scrollDOM.clientHeight<view.scrollDOM.scrollHeight-2;let marginTop=0,marginBottom=0,height;if(selfScroll){for(let source of view.state.facet(EditorView.scrollMargins)){let margins=source(view);if(margins===null||margins===void 0?void 0:margins.top)marginTop=Math.max(margins===null||margins===void 0?void 0:margins.top,marginTop);if(margins===null||margins===void 0?void 0:margins.bottom)marginBottom=Math.max(margins===null||margins===void 0?void 0:margins.bottom,marginBottom);}height=view.scrollDOM.clientHeight-marginTop-marginBottom;}else{height=(view.dom.ownerDocument.defaultView||window).innerHeight;}return{marginTop,marginBottom,selfScroll,height:Math.max(view.defaultLineHeight,height-5)};}function cursorByPage(view,forward){let page=pageInfo(view);let{state}=view,selection=updateSel(state.selection,range=>{return range.empty?view.moveVertically(range,forward,page.height):rangeEnd(range,forward);});if(selection.eq(state.selection))return false;let effect;if(page.selfScroll){let startPos=view.coordsAtPos(state.selection.main.head);let scrollRect=view.scrollDOM.getBoundingClientRect();let scrollTop=scrollRect.top+page.marginTop,scrollBottom=scrollRect.bottom-page.marginBottom;if(startPos&&startPos.top>scrollTop&&startPos.bottom<scrollBottom)effect=EditorView.scrollIntoView(selection.main.head,{y:"start",yMargin:startPos.top-scrollTop});}view.dispatch(setSel(state,selection),{effects:effect});return true;}/**
  Move the selection one page up.
  */const cursorPageUp=view=>cursorByPage(view,false);/**
  Move the selection one page down.
  */const cursorPageDown=view=>cursorByPage(view,true);function moveByLineBoundary(view,start,forward){let line=view.lineBlockAt(start.head),moved=view.moveToLineBoundary(start,forward);if(moved.head==start.head&&moved.head!=(forward?line.to:line.from))moved=view.moveToLineBoundary(start,forward,false);if(!forward&&moved.head==line.from&&line.length){let space=/^\s*/.exec(view.state.sliceDoc(line.from,Math.min(line.from+100,line.to)))[0].length;if(space&&start.head!=line.from+space)moved=EditorSelection.cursor(line.from+space);}return moved;}/**
  Move the selection to the next line wrap point, or to the end of
  the line if there isn't one left on this line.
  */const cursorLineBoundaryForward=view=>moveSel(view,range=>moveByLineBoundary(view,range,true));/**
  Move the selection to previous line wrap point, or failing that to
  the start of the line. If the line is indented, and the cursor
  isn't already at the end of the indentation, this will move to the
  end of the indentation instead of the start of the line.
  */const cursorLineBoundaryBackward=view=>moveSel(view,range=>moveByLineBoundary(view,range,false));/**
  Move the selection one line wrap point to the left.
  */const cursorLineBoundaryLeft=view=>moveSel(view,range=>moveByLineBoundary(view,range,!ltrAtCursor(view)));/**
  Move the selection one line wrap point to the right.
  */const cursorLineBoundaryRight=view=>moveSel(view,range=>moveByLineBoundary(view,range,ltrAtCursor(view)));/**
  Move the selection to the start of the line.
  */const cursorLineStart=view=>moveSel(view,range=>EditorSelection.cursor(view.lineBlockAt(range.head).from,1));/**
  Move the selection to the end of the line.
  */const cursorLineEnd=view=>moveSel(view,range=>EditorSelection.cursor(view.lineBlockAt(range.head).to,-1));function toMatchingBracket(state,dispatch,extend){let found=false,selection=updateSel(state.selection,range=>{let matching=matchBrackets(state,range.head,-1)||matchBrackets(state,range.head,1)||range.head>0&&matchBrackets(state,range.head-1,1)||range.head<state.doc.length&&matchBrackets(state,range.head+1,-1);if(!matching||!matching.end)return range;found=true;let head=matching.start.from==range.head?matching.end.to:matching.end.from;return EditorSelection.cursor(head);});if(!found)return false;dispatch(setSel(state,selection));return true;}/**
  Move the selection to the bracket matching the one it is currently
  on, if any.
  */const cursorMatchingBracket=({state,dispatch})=>toMatchingBracket(state,dispatch);function extendSel(view,how){let selection=updateSel(view.state.selection,range=>{let head=how(range);return EditorSelection.range(range.anchor,head.head,head.goalColumn,head.bidiLevel||undefined);});if(selection.eq(view.state.selection))return false;view.dispatch(setSel(view.state,selection));return true;}function selectByChar(view,forward){return extendSel(view,range=>view.moveByChar(range,forward));}/**
  Move the selection head one character to the left, while leaving
  the anchor in place.
  */const selectCharLeft=view=>selectByChar(view,!ltrAtCursor(view));/**
  Move the selection head one character to the right.
  */const selectCharRight=view=>selectByChar(view,ltrAtCursor(view));function selectByGroup(view,forward){return extendSel(view,range=>view.moveByGroup(range,forward));}/**
  Move the selection head one [group](https://codemirror.net/6/docs/ref/#commands.cursorGroupLeft) to
  the left.
  */const selectGroupLeft=view=>selectByGroup(view,!ltrAtCursor(view));/**
  Move the selection head one group to the right.
  */const selectGroupRight=view=>selectByGroup(view,ltrAtCursor(view));/**
  Move the selection head over the next syntactic element to the left.
  */const selectSyntaxLeft=view=>extendSel(view,range=>moveBySyntax(view.state,range,!ltrAtCursor(view)));/**
  Move the selection head over the next syntactic element to the right.
  */const selectSyntaxRight=view=>extendSel(view,range=>moveBySyntax(view.state,range,ltrAtCursor(view)));function selectByLine(view,forward){return extendSel(view,range=>view.moveVertically(range,forward));}/**
  Move the selection head one line up.
  */const selectLineUp=view=>selectByLine(view,false);/**
  Move the selection head one line down.
  */const selectLineDown=view=>selectByLine(view,true);function selectByPage(view,forward){return extendSel(view,range=>view.moveVertically(range,forward,pageInfo(view).height));}/**
  Move the selection head one page up.
  */const selectPageUp=view=>selectByPage(view,false);/**
  Move the selection head one page down.
  */const selectPageDown=view=>selectByPage(view,true);/**
  Move the selection head to the next line boundary.
  */const selectLineBoundaryForward=view=>extendSel(view,range=>moveByLineBoundary(view,range,true));/**
  Move the selection head to the previous line boundary.
  */const selectLineBoundaryBackward=view=>extendSel(view,range=>moveByLineBoundary(view,range,false));/**
  Move the selection head one line boundary to the left.
  */const selectLineBoundaryLeft=view=>extendSel(view,range=>moveByLineBoundary(view,range,!ltrAtCursor(view)));/**
  Move the selection head one line boundary to the right.
  */const selectLineBoundaryRight=view=>extendSel(view,range=>moveByLineBoundary(view,range,ltrAtCursor(view)));/**
  Move the selection head to the start of the line.
  */const selectLineStart=view=>extendSel(view,range=>EditorSelection.cursor(view.lineBlockAt(range.head).from));/**
  Move the selection head to the end of the line.
  */const selectLineEnd=view=>extendSel(view,range=>EditorSelection.cursor(view.lineBlockAt(range.head).to));/**
  Move the selection to the start of the document.
  */const cursorDocStart=({state,dispatch})=>{dispatch(setSel(state,{anchor:0}));return true;};/**
  Move the selection to the end of the document.
  */const cursorDocEnd=({state,dispatch})=>{dispatch(setSel(state,{anchor:state.doc.length}));return true;};/**
  Move the selection head to the start of the document.
  */const selectDocStart=({state,dispatch})=>{dispatch(setSel(state,{anchor:state.selection.main.anchor,head:0}));return true;};/**
  Move the selection head to the end of the document.
  */const selectDocEnd=({state,dispatch})=>{dispatch(setSel(state,{anchor:state.selection.main.anchor,head:state.doc.length}));return true;};/**
  Select the entire document.
  */const selectAll=({state,dispatch})=>{dispatch(state.update({selection:{anchor:0,head:state.doc.length},userEvent:"select"}));return true;};/**
  Expand the selection to cover entire lines.
  */const selectLine=({state,dispatch})=>{let ranges=selectedLineBlocks(state).map(({from,to})=>EditorSelection.range(from,Math.min(to+1,state.doc.length)));dispatch(state.update({selection:EditorSelection.create(ranges),userEvent:"select"}));return true;};/**
  Select the next syntactic construct that is larger than the
  selection. Note that this will only work insofar as the language
  [provider](https://codemirror.net/6/docs/ref/#language.language) you use builds up a full
  syntax tree.
  */const selectParentSyntax=({state,dispatch})=>{let selection=updateSel(state.selection,range=>{var _a;let stack=syntaxTree(state).resolveStack(range.from,1);for(let cur=stack;cur;cur=cur.next){let{node}=cur;if((node.from<range.from&&node.to>=range.to||node.to>range.to&&node.from<=range.from)&&((_a=node.parent)===null||_a===void 0?void 0:_a.parent))return EditorSelection.range(node.to,node.from);}return range;});dispatch(setSel(state,selection));return true;};/**
  Simplify the current selection. When multiple ranges are selected,
  reduce it to its main range. Otherwise, if the selection is
  non-empty, convert it to a cursor selection.
  */const simplifySelection=({state,dispatch})=>{let cur=state.selection,selection=null;if(cur.ranges.length>1)selection=EditorSelection.create([cur.main]);else if(!cur.main.empty)selection=EditorSelection.create([EditorSelection.cursor(cur.main.head)]);if(!selection)return false;dispatch(setSel(state,selection));return true;};function deleteBy(target,by){if(target.state.readOnly)return false;let event="delete.selection",{state}=target;let changes=state.changeByRange(range=>{let{from,to}=range;if(from==to){let towards=by(range);if(towards<from){event="delete.backward";towards=skipAtomic(target,towards,false);}else if(towards>from){event="delete.forward";towards=skipAtomic(target,towards,true);}from=Math.min(from,towards);to=Math.max(to,towards);}else{from=skipAtomic(target,from,false);to=skipAtomic(target,to,true);}return from==to?{range}:{changes:{from,to},range:EditorSelection.cursor(from,from<range.head?-1:1)};});if(changes.changes.empty)return false;target.dispatch(state.update(changes,{scrollIntoView:true,userEvent:event,effects:event=="delete.selection"?EditorView.announce.of(state.phrase("Selection deleted")):undefined}));return true;}function skipAtomic(target,pos,forward){if(target instanceof EditorView)for(let ranges of target.state.facet(EditorView.atomicRanges).map(f=>f(target)))ranges.between(pos,pos,(from,to)=>{if(from<pos&&to>pos)pos=forward?to:from;});return pos;}const deleteByChar=(target,forward)=>deleteBy(target,range=>{let pos=range.from,{state}=target,line=state.doc.lineAt(pos),before,targetPos;if(!forward&&pos>line.from&&pos<line.from+200&&!/[^ \t]/.test(before=line.text.slice(0,pos-line.from))){if(before[before.length-1]=="\t")return pos-1;let col=countColumn(before,state.tabSize),drop=col%getIndentUnit(state)||getIndentUnit(state);for(let i=0;i<drop&&before[before.length-1-i]==" ";i++)pos--;targetPos=pos;}else{targetPos=findClusterBreak(line.text,pos-line.from,forward,forward)+line.from;if(targetPos==pos&&line.number!=(forward?state.doc.lines:1))targetPos+=forward?1:-1;else if(!forward&&/[\ufe00-\ufe0f]/.test(line.text.slice(targetPos-line.from,pos-line.from)))targetPos=findClusterBreak(line.text,targetPos-line.from,false,false)+line.from;}return targetPos;});/**
  Delete the selection, or, for cursor selections, the character
  before the cursor.
  */const deleteCharBackward=view=>deleteByChar(view,false);/**
  Delete the selection or the character after the cursor.
  */const deleteCharForward=view=>deleteByChar(view,true);const deleteByGroup=(target,forward)=>deleteBy(target,range=>{let pos=range.head,{state}=target,line=state.doc.lineAt(pos);let categorize=state.charCategorizer(pos);for(let cat=null;;){if(pos==(forward?line.to:line.from)){if(pos==range.head&&line.number!=(forward?state.doc.lines:1))pos+=forward?1:-1;break;}let next=findClusterBreak(line.text,pos-line.from,forward)+line.from;let nextChar=line.text.slice(Math.min(pos,next)-line.from,Math.max(pos,next)-line.from);let nextCat=categorize(nextChar);if(cat!=null&&nextCat!=cat)break;if(nextChar!=" "||pos!=range.head)cat=nextCat;pos=next;}return pos;});/**
  Delete the selection or backward until the end of the next
  [group](https://codemirror.net/6/docs/ref/#view.EditorView.moveByGroup), only skipping groups of
  whitespace when they consist of a single space.
  */const deleteGroupBackward=target=>deleteByGroup(target,false);/**
  Delete the selection or forward until the end of the next group.
  */const deleteGroupForward=target=>deleteByGroup(target,true);/**
  Delete the selection, or, if it is a cursor selection, delete to
  the end of the line. If the cursor is directly at the end of the
  line, delete the line break after it.
  */const deleteToLineEnd=view=>deleteBy(view,range=>{let lineEnd=view.lineBlockAt(range.head).to;return range.head<lineEnd?lineEnd:Math.min(view.state.doc.length,range.head+1);});/**
  Delete the selection, or, if it is a cursor selection, delete to
  the start of the line or the next line wrap before the cursor.
  */const deleteLineBoundaryBackward=view=>deleteBy(view,range=>{let lineStart=view.moveToLineBoundary(range,false).head;return range.head>lineStart?lineStart:Math.max(0,range.head-1);});/**
  Delete the selection, or, if it is a cursor selection, delete to
  the end of the line or the next line wrap after the cursor.
  */const deleteLineBoundaryForward=view=>deleteBy(view,range=>{let lineStart=view.moveToLineBoundary(range,true).head;return range.head<lineStart?lineStart:Math.min(view.state.doc.length,range.head+1);});/**
  Replace each selection range with a line break, leaving the cursor
  on the line before the break.
  */const splitLine=({state,dispatch})=>{if(state.readOnly)return false;let changes=state.changeByRange(range=>{return{changes:{from:range.from,to:range.to,insert:Text.of(["",""])},range:EditorSelection.cursor(range.from)};});dispatch(state.update(changes,{scrollIntoView:true,userEvent:"input"}));return true;};/**
  Flip the characters before and after the cursor(s).
  */const transposeChars=({state,dispatch})=>{if(state.readOnly)return false;let changes=state.changeByRange(range=>{if(!range.empty||range.from==0||range.from==state.doc.length)return{range};let pos=range.from,line=state.doc.lineAt(pos);let from=pos==line.from?pos-1:findClusterBreak(line.text,pos-line.from,false)+line.from;let to=pos==line.to?pos+1:findClusterBreak(line.text,pos-line.from,true)+line.from;return{changes:{from,to,insert:state.doc.slice(pos,to).append(state.doc.slice(from,pos))},range:EditorSelection.cursor(to)};});if(changes.changes.empty)return false;dispatch(state.update(changes,{scrollIntoView:true,userEvent:"move.character"}));return true;};function selectedLineBlocks(state){let blocks=[],upto=-1;for(let range of state.selection.ranges){let startLine=state.doc.lineAt(range.from),endLine=state.doc.lineAt(range.to);if(!range.empty&&range.to==endLine.from)endLine=state.doc.lineAt(range.to-1);if(upto>=startLine.number){let prev=blocks[blocks.length-1];prev.to=endLine.to;prev.ranges.push(range);}else{blocks.push({from:startLine.from,to:endLine.to,ranges:[range]});}upto=endLine.number+1;}return blocks;}function moveLine(state,dispatch,forward){if(state.readOnly)return false;let changes=[],ranges=[];for(let block of selectedLineBlocks(state)){if(forward?block.to==state.doc.length:block.from==0)continue;let nextLine=state.doc.lineAt(forward?block.to+1:block.from-1);let size=nextLine.length+1;if(forward){changes.push({from:block.to,to:nextLine.to},{from:block.from,insert:nextLine.text+state.lineBreak});for(let r of block.ranges)ranges.push(EditorSelection.range(Math.min(state.doc.length,r.anchor+size),Math.min(state.doc.length,r.head+size)));}else{changes.push({from:nextLine.from,to:block.from},{from:block.to,insert:state.lineBreak+nextLine.text});for(let r of block.ranges)ranges.push(EditorSelection.range(r.anchor-size,r.head-size));}}if(!changes.length)return false;dispatch(state.update({changes,scrollIntoView:true,selection:EditorSelection.create(ranges,state.selection.mainIndex),userEvent:"move.line"}));return true;}/**
  Move the selected lines up one line.
  */const moveLineUp=({state,dispatch})=>moveLine(state,dispatch,false);/**
  Move the selected lines down one line.
  */const moveLineDown=({state,dispatch})=>moveLine(state,dispatch,true);function copyLine(state,dispatch,forward){if(state.readOnly)return false;let changes=[];for(let block of selectedLineBlocks(state)){if(forward)changes.push({from:block.from,insert:state.doc.slice(block.from,block.to)+state.lineBreak});else changes.push({from:block.to,insert:state.lineBreak+state.doc.slice(block.from,block.to)});}dispatch(state.update({changes,scrollIntoView:true,userEvent:"input.copyline"}));return true;}/**
  Create a copy of the selected lines. Keep the selection in the top copy.
  */const copyLineUp=({state,dispatch})=>copyLine(state,dispatch,false);/**
  Create a copy of the selected lines. Keep the selection in the bottom copy.
  */const copyLineDown=({state,dispatch})=>copyLine(state,dispatch,true);/**
  Delete selected lines.
  */const deleteLine=view=>{if(view.state.readOnly)return false;let{state}=view,changes=state.changes(selectedLineBlocks(state).map(({from,to})=>{if(from>0)from--;else if(to<state.doc.length)to++;return{from,to};}));let selection=updateSel(state.selection,range=>view.moveVertically(range,true)).map(changes);view.dispatch({changes,selection,scrollIntoView:true,userEvent:"delete.line"});return true;};function isBetweenBrackets(state,pos){if(/\(\)|\[\]|\{\}/.test(state.sliceDoc(pos-1,pos+1)))return{from:pos,to:pos};let context=syntaxTree(state).resolveInner(pos);let before=context.childBefore(pos),after=context.childAfter(pos),closedBy;if(before&&after&&before.to<=pos&&after.from>=pos&&(closedBy=before.type.prop(NodeProp.closedBy))&&closedBy.indexOf(after.name)>-1&&state.doc.lineAt(before.to).from==state.doc.lineAt(after.from).from&&!/\S/.test(state.sliceDoc(before.to,after.from)))return{from:before.to,to:after.from};return null;}/**
  Replace the selection with a newline and indent the newly created
  line(s). If the current line consists only of whitespace, this
  will also delete that whitespace. When the cursor is between
  matching brackets, an additional newline will be inserted after
  the cursor.
  */const insertNewlineAndIndent=/*@__PURE__*/newlineAndIndent(false);/**
  Create a blank, indented line below the current line.
  */const insertBlankLine=/*@__PURE__*/newlineAndIndent(true);function newlineAndIndent(atEof){return({state,dispatch})=>{if(state.readOnly)return false;let changes=state.changeByRange(range=>{let{from,to}=range,line=state.doc.lineAt(from);let explode=!atEof&&from==to&&isBetweenBrackets(state,from);if(atEof)from=to=(to<=line.to?line:state.doc.lineAt(to)).to;let cx=new IndentContext(state,{simulateBreak:from,simulateDoubleBreak:!!explode});let indent=getIndentation(cx,from);if(indent==null)indent=countColumn(/^\s*/.exec(state.doc.lineAt(from).text)[0],state.tabSize);while(to<line.to&&/\s/.test(line.text[to-line.from]))to++;if(explode)({from,to}=explode);else if(from>line.from&&from<line.from+100&&!/\S/.test(line.text.slice(0,from)))from=line.from;let insert=["",indentString(state,indent)];if(explode)insert.push(indentString(state,cx.lineIndent(line.from,-1)));return{changes:{from,to,insert:Text.of(insert)},range:EditorSelection.cursor(from+1+insert[1].length)};});dispatch(state.update(changes,{scrollIntoView:true,userEvent:"input"}));return true;};}function changeBySelectedLine(state,f){let atLine=-1;return state.changeByRange(range=>{let changes=[];for(let pos=range.from;pos<=range.to;){let line=state.doc.lineAt(pos);if(line.number>atLine&&(range.empty||range.to>line.from)){f(line,changes,range);atLine=line.number;}pos=line.to+1;}let changeSet=state.changes(changes);return{changes,range:EditorSelection.range(changeSet.mapPos(range.anchor,1),changeSet.mapPos(range.head,1))};});}/**
  Auto-indent the selected lines. This uses the [indentation service
  facet](https://codemirror.net/6/docs/ref/#language.indentService) as source for auto-indent
  information.
  */const indentSelection=({state,dispatch})=>{if(state.readOnly)return false;let updated=Object.create(null);let context=new IndentContext(state,{overrideIndentation:start=>{let found=updated[start];return found==null?-1:found;}});let changes=changeBySelectedLine(state,(line,changes,range)=>{let indent=getIndentation(context,line.from);if(indent==null)return;if(!/\S/.test(line.text))indent=0;let cur=/^\s*/.exec(line.text)[0];let norm=indentString(state,indent);if(cur!=norm||range.from<line.from+cur.length){updated[line.from]=indent;changes.push({from:line.from,to:line.from+cur.length,insert:norm});}});if(!changes.changes.empty)dispatch(state.update(changes,{userEvent:"indent"}));return true;};/**
  Add a [unit](https://codemirror.net/6/docs/ref/#language.indentUnit) of indentation to all selected
  lines.
  */const indentMore=({state,dispatch})=>{if(state.readOnly)return false;dispatch(state.update(changeBySelectedLine(state,(line,changes)=>{changes.push({from:line.from,insert:state.facet(indentUnit)});}),{userEvent:"input.indent"}));return true;};/**
  Remove a [unit](https://codemirror.net/6/docs/ref/#language.indentUnit) of indentation from all
  selected lines.
  */const indentLess=({state,dispatch})=>{if(state.readOnly)return false;dispatch(state.update(changeBySelectedLine(state,(line,changes)=>{let space=/^\s*/.exec(line.text)[0];if(!space)return;let col=countColumn(space,state.tabSize),keep=0;let insert=indentString(state,Math.max(0,col-getIndentUnit(state)));while(keep<space.length&&keep<insert.length&&space.charCodeAt(keep)==insert.charCodeAt(keep))keep++;changes.push({from:line.from+keep,to:line.from+space.length,insert:insert.slice(keep)});}),{userEvent:"delete.dedent"}));return true;};/**
  Array of key bindings containing the Emacs-style bindings that are
  available on macOS by default.

   - Ctrl-b: [`cursorCharLeft`](https://codemirror.net/6/docs/ref/#commands.cursorCharLeft) ([`selectCharLeft`](https://codemirror.net/6/docs/ref/#commands.selectCharLeft) with Shift)
   - Ctrl-f: [`cursorCharRight`](https://codemirror.net/6/docs/ref/#commands.cursorCharRight) ([`selectCharRight`](https://codemirror.net/6/docs/ref/#commands.selectCharRight) with Shift)
   - Ctrl-p: [`cursorLineUp`](https://codemirror.net/6/docs/ref/#commands.cursorLineUp) ([`selectLineUp`](https://codemirror.net/6/docs/ref/#commands.selectLineUp) with Shift)
   - Ctrl-n: [`cursorLineDown`](https://codemirror.net/6/docs/ref/#commands.cursorLineDown) ([`selectLineDown`](https://codemirror.net/6/docs/ref/#commands.selectLineDown) with Shift)
   - Ctrl-a: [`cursorLineStart`](https://codemirror.net/6/docs/ref/#commands.cursorLineStart) ([`selectLineStart`](https://codemirror.net/6/docs/ref/#commands.selectLineStart) with Shift)
   - Ctrl-e: [`cursorLineEnd`](https://codemirror.net/6/docs/ref/#commands.cursorLineEnd) ([`selectLineEnd`](https://codemirror.net/6/docs/ref/#commands.selectLineEnd) with Shift)
   - Ctrl-d: [`deleteCharForward`](https://codemirror.net/6/docs/ref/#commands.deleteCharForward)
   - Ctrl-h: [`deleteCharBackward`](https://codemirror.net/6/docs/ref/#commands.deleteCharBackward)
   - Ctrl-k: [`deleteToLineEnd`](https://codemirror.net/6/docs/ref/#commands.deleteToLineEnd)
   - Ctrl-Alt-h: [`deleteGroupBackward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupBackward)
   - Ctrl-o: [`splitLine`](https://codemirror.net/6/docs/ref/#commands.splitLine)
   - Ctrl-t: [`transposeChars`](https://codemirror.net/6/docs/ref/#commands.transposeChars)
   - Ctrl-v: [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown)
   - Alt-v: [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp)
  */const emacsStyleKeymap=[{key:"Ctrl-b",run:cursorCharLeft,shift:selectCharLeft,preventDefault:true},{key:"Ctrl-f",run:cursorCharRight,shift:selectCharRight},{key:"Ctrl-p",run:cursorLineUp,shift:selectLineUp},{key:"Ctrl-n",run:cursorLineDown,shift:selectLineDown},{key:"Ctrl-a",run:cursorLineStart,shift:selectLineStart},{key:"Ctrl-e",run:cursorLineEnd,shift:selectLineEnd},{key:"Ctrl-d",run:deleteCharForward},{key:"Ctrl-h",run:deleteCharBackward},{key:"Ctrl-k",run:deleteToLineEnd},{key:"Ctrl-Alt-h",run:deleteGroupBackward},{key:"Ctrl-o",run:splitLine},{key:"Ctrl-t",run:transposeChars},{key:"Ctrl-v",run:cursorPageDown}];/**
  An array of key bindings closely sticking to platform-standard or
  widely used bindings. (This includes the bindings from
  [`emacsStyleKeymap`](https://codemirror.net/6/docs/ref/#commands.emacsStyleKeymap), with their `key`
  property changed to `mac`.)

   - ArrowLeft: [`cursorCharLeft`](https://codemirror.net/6/docs/ref/#commands.cursorCharLeft) ([`selectCharLeft`](https://codemirror.net/6/docs/ref/#commands.selectCharLeft) with Shift)
   - ArrowRight: [`cursorCharRight`](https://codemirror.net/6/docs/ref/#commands.cursorCharRight) ([`selectCharRight`](https://codemirror.net/6/docs/ref/#commands.selectCharRight) with Shift)
   - Ctrl-ArrowLeft (Alt-ArrowLeft on macOS): [`cursorGroupLeft`](https://codemirror.net/6/docs/ref/#commands.cursorGroupLeft) ([`selectGroupLeft`](https://codemirror.net/6/docs/ref/#commands.selectGroupLeft) with Shift)
   - Ctrl-ArrowRight (Alt-ArrowRight on macOS): [`cursorGroupRight`](https://codemirror.net/6/docs/ref/#commands.cursorGroupRight) ([`selectGroupRight`](https://codemirror.net/6/docs/ref/#commands.selectGroupRight) with Shift)
   - Cmd-ArrowLeft (on macOS): [`cursorLineStart`](https://codemirror.net/6/docs/ref/#commands.cursorLineStart) ([`selectLineStart`](https://codemirror.net/6/docs/ref/#commands.selectLineStart) with Shift)
   - Cmd-ArrowRight (on macOS): [`cursorLineEnd`](https://codemirror.net/6/docs/ref/#commands.cursorLineEnd) ([`selectLineEnd`](https://codemirror.net/6/docs/ref/#commands.selectLineEnd) with Shift)
   - ArrowUp: [`cursorLineUp`](https://codemirror.net/6/docs/ref/#commands.cursorLineUp) ([`selectLineUp`](https://codemirror.net/6/docs/ref/#commands.selectLineUp) with Shift)
   - ArrowDown: [`cursorLineDown`](https://codemirror.net/6/docs/ref/#commands.cursorLineDown) ([`selectLineDown`](https://codemirror.net/6/docs/ref/#commands.selectLineDown) with Shift)
   - Cmd-ArrowUp (on macOS): [`cursorDocStart`](https://codemirror.net/6/docs/ref/#commands.cursorDocStart) ([`selectDocStart`](https://codemirror.net/6/docs/ref/#commands.selectDocStart) with Shift)
   - Cmd-ArrowDown (on macOS): [`cursorDocEnd`](https://codemirror.net/6/docs/ref/#commands.cursorDocEnd) ([`selectDocEnd`](https://codemirror.net/6/docs/ref/#commands.selectDocEnd) with Shift)
   - Ctrl-ArrowUp (on macOS): [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp) ([`selectPageUp`](https://codemirror.net/6/docs/ref/#commands.selectPageUp) with Shift)
   - Ctrl-ArrowDown (on macOS): [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown) ([`selectPageDown`](https://codemirror.net/6/docs/ref/#commands.selectPageDown) with Shift)
   - PageUp: [`cursorPageUp`](https://codemirror.net/6/docs/ref/#commands.cursorPageUp) ([`selectPageUp`](https://codemirror.net/6/docs/ref/#commands.selectPageUp) with Shift)
   - PageDown: [`cursorPageDown`](https://codemirror.net/6/docs/ref/#commands.cursorPageDown) ([`selectPageDown`](https://codemirror.net/6/docs/ref/#commands.selectPageDown) with Shift)
   - Home: [`cursorLineBoundaryBackward`](https://codemirror.net/6/docs/ref/#commands.cursorLineBoundaryBackward) ([`selectLineBoundaryBackward`](https://codemirror.net/6/docs/ref/#commands.selectLineBoundaryBackward) with Shift)
   - End: [`cursorLineBoundaryForward`](https://codemirror.net/6/docs/ref/#commands.cursorLineBoundaryForward) ([`selectLineBoundaryForward`](https://codemirror.net/6/docs/ref/#commands.selectLineBoundaryForward) with Shift)
   - Ctrl-Home (Cmd-Home on macOS): [`cursorDocStart`](https://codemirror.net/6/docs/ref/#commands.cursorDocStart) ([`selectDocStart`](https://codemirror.net/6/docs/ref/#commands.selectDocStart) with Shift)
   - Ctrl-End (Cmd-Home on macOS): [`cursorDocEnd`](https://codemirror.net/6/docs/ref/#commands.cursorDocEnd) ([`selectDocEnd`](https://codemirror.net/6/docs/ref/#commands.selectDocEnd) with Shift)
   - Enter: [`insertNewlineAndIndent`](https://codemirror.net/6/docs/ref/#commands.insertNewlineAndIndent)
   - Ctrl-a (Cmd-a on macOS): [`selectAll`](https://codemirror.net/6/docs/ref/#commands.selectAll)
   - Backspace: [`deleteCharBackward`](https://codemirror.net/6/docs/ref/#commands.deleteCharBackward)
   - Delete: [`deleteCharForward`](https://codemirror.net/6/docs/ref/#commands.deleteCharForward)
   - Ctrl-Backspace (Alt-Backspace on macOS): [`deleteGroupBackward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupBackward)
   - Ctrl-Delete (Alt-Delete on macOS): [`deleteGroupForward`](https://codemirror.net/6/docs/ref/#commands.deleteGroupForward)
   - Cmd-Backspace (macOS): [`deleteLineBoundaryBackward`](https://codemirror.net/6/docs/ref/#commands.deleteLineBoundaryBackward).
   - Cmd-Delete (macOS): [`deleteLineBoundaryForward`](https://codemirror.net/6/docs/ref/#commands.deleteLineBoundaryForward).
  */const standardKeymap=/*@__PURE__*/[{key:"ArrowLeft",run:cursorCharLeft,shift:selectCharLeft,preventDefault:true},{key:"Mod-ArrowLeft",mac:"Alt-ArrowLeft",run:cursorGroupLeft,shift:selectGroupLeft,preventDefault:true},{mac:"Cmd-ArrowLeft",run:cursorLineBoundaryLeft,shift:selectLineBoundaryLeft,preventDefault:true},{key:"ArrowRight",run:cursorCharRight,shift:selectCharRight,preventDefault:true},{key:"Mod-ArrowRight",mac:"Alt-ArrowRight",run:cursorGroupRight,shift:selectGroupRight,preventDefault:true},{mac:"Cmd-ArrowRight",run:cursorLineBoundaryRight,shift:selectLineBoundaryRight,preventDefault:true},{key:"ArrowUp",run:cursorLineUp,shift:selectLineUp,preventDefault:true},{mac:"Cmd-ArrowUp",run:cursorDocStart,shift:selectDocStart},{mac:"Ctrl-ArrowUp",run:cursorPageUp,shift:selectPageUp},{key:"ArrowDown",run:cursorLineDown,shift:selectLineDown,preventDefault:true},{mac:"Cmd-ArrowDown",run:cursorDocEnd,shift:selectDocEnd},{mac:"Ctrl-ArrowDown",run:cursorPageDown,shift:selectPageDown},{key:"PageUp",run:cursorPageUp,shift:selectPageUp},{key:"PageDown",run:cursorPageDown,shift:selectPageDown},{key:"Home",run:cursorLineBoundaryBackward,shift:selectLineBoundaryBackward,preventDefault:true},{key:"Mod-Home",run:cursorDocStart,shift:selectDocStart},{key:"End",run:cursorLineBoundaryForward,shift:selectLineBoundaryForward,preventDefault:true},{key:"Mod-End",run:cursorDocEnd,shift:selectDocEnd},{key:"Enter",run:insertNewlineAndIndent},{key:"Mod-a",run:selectAll},{key:"Backspace",run:deleteCharBackward,shift:deleteCharBackward},{key:"Delete",run:deleteCharForward},{key:"Mod-Backspace",mac:"Alt-Backspace",run:deleteGroupBackward},{key:"Mod-Delete",mac:"Alt-Delete",run:deleteGroupForward},{mac:"Mod-Backspace",run:deleteLineBoundaryBackward},{mac:"Mod-Delete",run:deleteLineBoundaryForward}].concat(/*@__PURE__*/emacsStyleKeymap.map(b=>({mac:b.key,run:b.run,shift:b.shift})));/**
  The default keymap. Includes all bindings from
  [`standardKeymap`](https://codemirror.net/6/docs/ref/#commands.standardKeymap) plus the following:

  - Alt-ArrowLeft (Ctrl-ArrowLeft on macOS): [`cursorSyntaxLeft`](https://codemirror.net/6/docs/ref/#commands.cursorSyntaxLeft) ([`selectSyntaxLeft`](https://codemirror.net/6/docs/ref/#commands.selectSyntaxLeft) with Shift)
  - Alt-ArrowRight (Ctrl-ArrowRight on macOS): [`cursorSyntaxRight`](https://codemirror.net/6/docs/ref/#commands.cursorSyntaxRight) ([`selectSyntaxRight`](https://codemirror.net/6/docs/ref/#commands.selectSyntaxRight) with Shift)
  - Alt-ArrowUp: [`moveLineUp`](https://codemirror.net/6/docs/ref/#commands.moveLineUp)
  - Alt-ArrowDown: [`moveLineDown`](https://codemirror.net/6/docs/ref/#commands.moveLineDown)
  - Shift-Alt-ArrowUp: [`copyLineUp`](https://codemirror.net/6/docs/ref/#commands.copyLineUp)
  - Shift-Alt-ArrowDown: [`copyLineDown`](https://codemirror.net/6/docs/ref/#commands.copyLineDown)
  - Escape: [`simplifySelection`](https://codemirror.net/6/docs/ref/#commands.simplifySelection)
  - Ctrl-Enter (Cmd-Enter on macOS): [`insertBlankLine`](https://codemirror.net/6/docs/ref/#commands.insertBlankLine)
  - Alt-l (Ctrl-l on macOS): [`selectLine`](https://codemirror.net/6/docs/ref/#commands.selectLine)
  - Ctrl-i (Cmd-i on macOS): [`selectParentSyntax`](https://codemirror.net/6/docs/ref/#commands.selectParentSyntax)
  - Ctrl-[ (Cmd-[ on macOS): [`indentLess`](https://codemirror.net/6/docs/ref/#commands.indentLess)
  - Ctrl-] (Cmd-] on macOS): [`indentMore`](https://codemirror.net/6/docs/ref/#commands.indentMore)
  - Ctrl-Alt-\\ (Cmd-Alt-\\ on macOS): [`indentSelection`](https://codemirror.net/6/docs/ref/#commands.indentSelection)
  - Shift-Ctrl-k (Shift-Cmd-k on macOS): [`deleteLine`](https://codemirror.net/6/docs/ref/#commands.deleteLine)
  - Shift-Ctrl-\\ (Shift-Cmd-\\ on macOS): [`cursorMatchingBracket`](https://codemirror.net/6/docs/ref/#commands.cursorMatchingBracket)
  - Ctrl-/ (Cmd-/ on macOS): [`toggleComment`](https://codemirror.net/6/docs/ref/#commands.toggleComment).
  - Shift-Alt-a: [`toggleBlockComment`](https://codemirror.net/6/docs/ref/#commands.toggleBlockComment).
  */const defaultKeymap=/*@__PURE__*/[{key:"Alt-ArrowLeft",mac:"Ctrl-ArrowLeft",run:cursorSyntaxLeft,shift:selectSyntaxLeft},{key:"Alt-ArrowRight",mac:"Ctrl-ArrowRight",run:cursorSyntaxRight,shift:selectSyntaxRight},{key:"Alt-ArrowUp",run:moveLineUp},{key:"Shift-Alt-ArrowUp",run:copyLineUp},{key:"Alt-ArrowDown",run:moveLineDown},{key:"Shift-Alt-ArrowDown",run:copyLineDown},{key:"Escape",run:simplifySelection},{key:"Mod-Enter",run:insertBlankLine},{key:"Alt-l",mac:"Ctrl-l",run:selectLine},{key:"Mod-i",run:selectParentSyntax,preventDefault:true},{key:"Mod-[",run:indentLess},{key:"Mod-]",run:indentMore},{key:"Mod-Alt-\\",run:indentSelection},{key:"Shift-Mod-k",run:deleteLine},{key:"Shift-Mod-\\",run:cursorMatchingBracket},{key:"Mod-/",run:toggleComment},{key:"Alt-A",run:toggleBlockComment}].concat(standardKeymap);function crelt(){var elt=arguments[0];if(typeof elt=="string")elt=document.createElement(elt);var i=1,next=arguments[1];if(next&&typeof next=="object"&&next.nodeType==null&&!Array.isArray(next)){for(var name in next)if(Object.prototype.hasOwnProperty.call(next,name)){var value=next[name];if(typeof value=="string")elt.setAttribute(name,value);else if(value!=null)elt[name]=value;}i++;}for(;i<arguments.length;i++)add(elt,arguments[i]);return elt;}function add(elt,child){if(typeof child=="string"){elt.appendChild(document.createTextNode(child));}else if(child==null);else if(child.nodeType!=null){elt.appendChild(child);}else if(Array.isArray(child)){for(var i=0;i<child.length;i++)add(elt,child[i]);}else{throw new RangeError("Unsupported child node: "+child);}}const basicNormalize=typeof String.prototype.normalize=="function"?x=>x.normalize("NFKD"):x=>x;/**
  A search cursor provides an iterator over text matches in a
  document.
  */class SearchCursor{/**
      Create a text cursor. The query is the search string, `from` to
      `to` provides the region to search.
      
      When `normalize` is given, it will be called, on both the query
      string and the content it is matched against, before comparing.
      You can, for example, create a case-insensitive search by
      passing `s => s.toLowerCase()`.
      
      Text is always normalized with
      [`.normalize("NFKD")`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
      (when supported).
      */constructor(text,query,from=0,to=text.length,normalize,test){this.test=test;/**
          The current match (only holds a meaningful value after
          [`next`](https://codemirror.net/6/docs/ref/#search.SearchCursor.next) has been called and when
          `done` is false).
          */this.value={from:0,to:0};/**
          Whether the end of the iterated region has been reached.
          */this.done=false;this.matches=[];this.buffer="";this.bufferPos=0;this.iter=text.iterRange(from,to);this.bufferStart=from;this.normalize=normalize?x=>normalize(basicNormalize(x)):basicNormalize;this.query=this.normalize(query);}peek(){if(this.bufferPos==this.buffer.length){this.bufferStart+=this.buffer.length;this.iter.next();if(this.iter.done)return-1;this.bufferPos=0;this.buffer=this.iter.value;}return codePointAt(this.buffer,this.bufferPos);}/**
      Look for the next match. Updates the iterator's
      [`value`](https://codemirror.net/6/docs/ref/#search.SearchCursor.value) and
      [`done`](https://codemirror.net/6/docs/ref/#search.SearchCursor.done) properties. Should be called
      at least once before using the cursor.
      */next(){while(this.matches.length)this.matches.pop();return this.nextOverlapping();}/**
      The `next` method will ignore matches that partially overlap a
      previous match. This method behaves like `next`, but includes
      such matches.
      */nextOverlapping(){for(;;){let next=this.peek();if(next<0){this.done=true;return this;}let str=fromCodePoint(next),start=this.bufferStart+this.bufferPos;this.bufferPos+=codePointSize(next);let norm=this.normalize(str);for(let i=0,pos=start;;i++){let code=norm.charCodeAt(i);let match=this.match(code,pos,this.bufferPos+this.bufferStart);if(i==norm.length-1){if(match){this.value=match;return this;}break;}if(pos==start&&i<str.length&&str.charCodeAt(i)==code)pos++;}}}match(code,pos,end){let match=null;for(let i=0;i<this.matches.length;i+=2){let index=this.matches[i],keep=false;if(this.query.charCodeAt(index)==code){if(index==this.query.length-1){match={from:this.matches[i+1],to:end};}else{this.matches[i]++;keep=true;}}if(!keep){this.matches.splice(i,2);i-=2;}}if(this.query.charCodeAt(0)==code){if(this.query.length==1)match={from:pos,to:end};else this.matches.push(1,pos);}if(match&&this.test&&!this.test(match.from,match.to,this.buffer,this.bufferStart))match=null;return match;}}if(typeof Symbol!="undefined")SearchCursor.prototype[Symbol.iterator]=function(){return this;};const empty={from:-1,to:-1,match:/*@__PURE__*/ /.*/.exec("")};const baseFlags="gm"+(/x/.unicode==null?"":"u");/**
  This class is similar to [`SearchCursor`](https://codemirror.net/6/docs/ref/#search.SearchCursor)
  but searches for a regular expression pattern instead of a plain
  string.
  */class RegExpCursor{/**
      Create a cursor that will search the given range in the given
      document. `query` should be the raw pattern (as you'd pass it to
      `new RegExp`).
      */constructor(text,query,options,from=0,to=text.length){this.text=text;this.to=to;this.curLine="";/**
          Set to `true` when the cursor has reached the end of the search
          range.
          */this.done=false;/**
          Will contain an object with the extent of the match and the
          match object when [`next`](https://codemirror.net/6/docs/ref/#search.RegExpCursor.next)
          sucessfully finds a match.
          */this.value=empty;if(/\\[sWDnr]|\n|\r|\[\^/.test(query))return new MultilineRegExpCursor(text,query,options,from,to);this.re=new RegExp(query,baseFlags+((options===null||options===void 0?void 0:options.ignoreCase)?"i":""));this.test=options===null||options===void 0?void 0:options.test;this.iter=text.iter();let startLine=text.lineAt(from);this.curLineStart=startLine.from;this.matchPos=toCharEnd(text,from);this.getLine(this.curLineStart);}getLine(skip){this.iter.next(skip);if(this.iter.lineBreak){this.curLine="";}else{this.curLine=this.iter.value;if(this.curLineStart+this.curLine.length>this.to)this.curLine=this.curLine.slice(0,this.to-this.curLineStart);this.iter.next();}}nextLine(){this.curLineStart=this.curLineStart+this.curLine.length+1;if(this.curLineStart>this.to)this.curLine="";else this.getLine(0);}/**
      Move to the next match, if there is one.
      */next(){for(let off=this.matchPos-this.curLineStart;;){this.re.lastIndex=off;let match=this.matchPos<=this.to&&this.re.exec(this.curLine);if(match){let from=this.curLineStart+match.index,to=from+match[0].length;this.matchPos=toCharEnd(this.text,to+(from==to?1:0));if(from==this.curLineStart+this.curLine.length)this.nextLine();if((from<to||from>this.value.to)&&(!this.test||this.test(from,to,match))){this.value={from,to,match};return this;}off=this.matchPos-this.curLineStart;}else if(this.curLineStart+this.curLine.length<this.to){this.nextLine();off=0;}else{this.done=true;return this;}}}}const flattened=/*@__PURE__*/new WeakMap();// Reusable (partially) flattened document strings
class FlattenedDoc{constructor(from,text){this.from=from;this.text=text;}get to(){return this.from+this.text.length;}static get(doc,from,to){let cached=flattened.get(doc);if(!cached||cached.from>=to||cached.to<=from){let flat=new FlattenedDoc(from,doc.sliceString(from,to));flattened.set(doc,flat);return flat;}if(cached.from==from&&cached.to==to)return cached;let{text,from:cachedFrom}=cached;if(cachedFrom>from){text=doc.sliceString(from,cachedFrom)+text;cachedFrom=from;}if(cached.to<to)text+=doc.sliceString(cached.to,to);flattened.set(doc,new FlattenedDoc(cachedFrom,text));return new FlattenedDoc(from,text.slice(from-cachedFrom,to-cachedFrom));}}class MultilineRegExpCursor{constructor(text,query,options,from,to){this.text=text;this.to=to;this.done=false;this.value=empty;this.matchPos=toCharEnd(text,from);this.re=new RegExp(query,baseFlags+((options===null||options===void 0?void 0:options.ignoreCase)?"i":""));this.test=options===null||options===void 0?void 0:options.test;this.flat=FlattenedDoc.get(text,from,this.chunkEnd(from+5000/* Chunk.Base */));}chunkEnd(pos){return pos>=this.to?this.to:this.text.lineAt(pos).to;}next(){for(;;){let off=this.re.lastIndex=this.matchPos-this.flat.from;let match=this.re.exec(this.flat.text);// Skip empty matches directly after the last match
if(match&&!match[0]&&match.index==off){this.re.lastIndex=off+1;match=this.re.exec(this.flat.text);}if(match){let from=this.flat.from+match.index,to=from+match[0].length;// If a match goes almost to the end of a noncomplete chunk, try
// again, since it'll likely be able to match more
if((this.flat.to>=this.to||match.index+match[0].length<=this.flat.text.length-10)&&(!this.test||this.test(from,to,match))){this.value={from,to,match};this.matchPos=toCharEnd(this.text,to+(from==to?1:0));return this;}}if(this.flat.to==this.to){this.done=true;return this;}// Grow the flattened doc
this.flat=FlattenedDoc.get(this.text,this.flat.from,this.chunkEnd(this.flat.from+this.flat.text.length*2));}}}if(typeof Symbol!="undefined"){RegExpCursor.prototype[Symbol.iterator]=MultilineRegExpCursor.prototype[Symbol.iterator]=function(){return this;};}function validRegExp(source){try{new RegExp(source,baseFlags);return true;}catch(_a){return false;}}function toCharEnd(text,pos){if(pos>=text.length)return pos;let line=text.lineAt(pos),next;while(pos<line.to&&(next=line.text.charCodeAt(pos-line.from))>=0xDC00&&next<0xE000)pos++;return pos;}function createLineDialog(view){let line=String(view.state.doc.lineAt(view.state.selection.main.head).number);let input=crelt("input",{class:"cm-textfield",name:"line",value:line});let dom=crelt("form",{class:"cm-gotoLine",onkeydown:event=>{if(event.keyCode==27){// Escape
event.preventDefault();view.dispatch({effects:dialogEffect.of(false)});view.focus();}else if(event.keyCode==13){// Enter
event.preventDefault();go();}},onsubmit:event=>{event.preventDefault();go();}},crelt("label",view.state.phrase("Go to line"),": ",input)," ",crelt("button",{class:"cm-button",type:"submit"},view.state.phrase("go")));function go(){let match=/^([+-])?(\d+)?(:\d+)?(%)?$/.exec(input.value);if(!match)return;let{state}=view,startLine=state.doc.lineAt(state.selection.main.head);let[,sign,ln,cl,percent]=match;let col=cl?+cl.slice(1):0;let line=ln?+ln:startLine.number;if(ln&&percent){let pc=line/100;if(sign)pc=pc*(sign=="-"?-1:1)+startLine.number/state.doc.lines;line=Math.round(state.doc.lines*pc);}else if(ln&&sign){line=line*(sign=="-"?-1:1)+startLine.number;}let docLine=state.doc.line(Math.max(1,Math.min(state.doc.lines,line)));let selection=EditorSelection.cursor(docLine.from+Math.max(0,Math.min(col,docLine.length)));view.dispatch({effects:[dialogEffect.of(false),EditorView.scrollIntoView(selection.from,{y:'center'})],selection});view.focus();}return{dom};}const dialogEffect=/*@__PURE__*/StateEffect.define();const dialogField=/*@__PURE__*/StateField.define({create(){return true;},update(value,tr){for(let e of tr.effects)if(e.is(dialogEffect))value=e.value;return value;},provide:f=>showPanel.from(f,val=>val?createLineDialog:null)});/**
  Command that shows a dialog asking the user for a line number, and
  when a valid position is provided, moves the cursor to that line.

  Supports line numbers, relative line offsets prefixed with `+` or
  `-`, document percentages suffixed with `%`, and an optional
  column position by adding `:` and a second number after the line
  number.
  */const gotoLine=view=>{let panel=getPanel(view,createLineDialog);if(!panel){let effects=[dialogEffect.of(true)];if(view.state.field(dialogField,false)==null)effects.push(StateEffect.appendConfig.of([dialogField,baseTheme$1$1]));view.dispatch({effects});panel=getPanel(view,createLineDialog);}if(panel)panel.dom.querySelector("input").select();return true;};const baseTheme$1$1=/*@__PURE__*/EditorView.baseTheme({".cm-panel.cm-gotoLine":{padding:"2px 6px 4px","& label":{fontSize:"80%"}}});const defaultHighlightOptions={highlightWordAroundCursor:false,minSelectionLength:1,maxMatches:100,wholeWords:false};const highlightConfig=/*@__PURE__*/Facet.define({combine(options){return combineConfig(options,defaultHighlightOptions,{highlightWordAroundCursor:(a,b)=>a||b,minSelectionLength:Math.min,maxMatches:Math.min});}});/**
  This extension highlights text that matches the selection. It uses
  the `"cm-selectionMatch"` class for the highlighting. When
  `highlightWordAroundCursor` is enabled, the word at the cursor
  itself will be highlighted with `"cm-selectionMatch-main"`.
  */function highlightSelectionMatches(options){let ext=[defaultTheme,matchHighlighter];return ext;}const matchDeco=/*@__PURE__*/Decoration.mark({class:"cm-selectionMatch"});const mainMatchDeco=/*@__PURE__*/Decoration.mark({class:"cm-selectionMatch cm-selectionMatch-main"});// Whether the characters directly outside the given positions are non-word characters
function insideWordBoundaries(check,state,from,to){return(from==0||check(state.sliceDoc(from-1,from))!=CharCategory.Word)&&(to==state.doc.length||check(state.sliceDoc(to,to+1))!=CharCategory.Word);}// Whether the characters directly at the given positions are word characters
function insideWord(check,state,from,to){return check(state.sliceDoc(from,from+1))==CharCategory.Word&&check(state.sliceDoc(to-1,to))==CharCategory.Word;}const matchHighlighter=/*@__PURE__*/ViewPlugin.fromClass(class{constructor(view){this.decorations=this.getDeco(view);}update(update){if(update.selectionSet||update.docChanged||update.viewportChanged)this.decorations=this.getDeco(update.view);}getDeco(view){let conf=view.state.facet(highlightConfig);let{state}=view,sel=state.selection;if(sel.ranges.length>1)return Decoration.none;let range=sel.main,query,check=null;if(range.empty){if(!conf.highlightWordAroundCursor)return Decoration.none;let word=state.wordAt(range.head);if(!word)return Decoration.none;check=state.charCategorizer(range.head);query=state.sliceDoc(word.from,word.to);}else{let len=range.to-range.from;if(len<conf.minSelectionLength||len>200)return Decoration.none;if(conf.wholeWords){query=state.sliceDoc(range.from,range.to);// TODO: allow and include leading/trailing space?
check=state.charCategorizer(range.head);if(!(insideWordBoundaries(check,state,range.from,range.to)&&insideWord(check,state,range.from,range.to)))return Decoration.none;}else{query=state.sliceDoc(range.from,range.to);if(!query)return Decoration.none;}}let deco=[];for(let part of view.visibleRanges){let cursor=new SearchCursor(state.doc,query,part.from,part.to);while(!cursor.next().done){let{from,to}=cursor.value;if(!check||insideWordBoundaries(check,state,from,to)){if(range.empty&&from<=range.from&&to>=range.to)deco.push(mainMatchDeco.range(from,to));else if(from>=range.to||to<=range.from)deco.push(matchDeco.range(from,to));if(deco.length>conf.maxMatches)return Decoration.none;}}}return Decoration.set(deco);}},{decorations:v=>v.decorations});const defaultTheme=/*@__PURE__*/EditorView.baseTheme({".cm-selectionMatch":{backgroundColor:"#99ff7780"},".cm-searchMatch .cm-selectionMatch":{backgroundColor:"transparent"}});// Select the words around the cursors.
const selectWord=({state,dispatch})=>{let{selection}=state;let newSel=EditorSelection.create(selection.ranges.map(range=>state.wordAt(range.head)||EditorSelection.cursor(range.head)),selection.mainIndex);if(newSel.eq(selection))return false;dispatch(state.update({selection:newSel}));return true;};// Find next occurrence of query relative to last cursor. Wrap around
// the document if there are no more matches.
function findNextOccurrence(state,query){let{main,ranges}=state.selection;let word=state.wordAt(main.head),fullWord=word&&word.from==main.from&&word.to==main.to;for(let cycled=false,cursor=new SearchCursor(state.doc,query,ranges[ranges.length-1].to);;){cursor.next();if(cursor.done){if(cycled)return null;cursor=new SearchCursor(state.doc,query,0,Math.max(0,ranges[ranges.length-1].from-1));cycled=true;}else{if(cycled&&ranges.some(r=>r.from==cursor.value.from))continue;if(fullWord){let word=state.wordAt(cursor.value.from);if(!word||word.from!=cursor.value.from||word.to!=cursor.value.to)continue;}return cursor.value;}}}/**
  Select next occurrence of the current selection. Expand selection
  to the surrounding word when the selection is empty.
  */const selectNextOccurrence=({state,dispatch})=>{let{ranges}=state.selection;if(ranges.some(sel=>sel.from===sel.to))return selectWord({state,dispatch});let searchedText=state.sliceDoc(ranges[0].from,ranges[0].to);if(state.selection.ranges.some(r=>state.sliceDoc(r.from,r.to)!=searchedText))return false;let range=findNextOccurrence(state,searchedText);if(!range)return false;dispatch(state.update({selection:state.selection.addRange(EditorSelection.range(range.from,range.to),false),effects:EditorView.scrollIntoView(range.to)}));return true;};const searchConfigFacet=/*@__PURE__*/Facet.define({combine(configs){return combineConfig(configs,{top:false,caseSensitive:false,literal:false,regexp:false,wholeWord:false,createPanel:view=>new SearchPanel(view),scrollToMatch:range=>EditorView.scrollIntoView(range)});}});/**
  A search query. Part of the editor's search state.
  */class SearchQuery{/**
      Create a query object.
      */constructor(config){this.search=config.search;this.caseSensitive=!!config.caseSensitive;this.literal=!!config.literal;this.regexp=!!config.regexp;this.replace=config.replace||"";this.valid=!!this.search&&(!this.regexp||validRegExp(this.search));this.unquoted=this.unquote(this.search);this.wholeWord=!!config.wholeWord;}/**
      @internal
      */unquote(text){return this.literal?text:text.replace(/\\([nrt\\])/g,(_,ch)=>ch=="n"?"\n":ch=="r"?"\r":ch=="t"?"\t":"\\");}/**
      Compare this query to another query.
      */eq(other){return this.search==other.search&&this.replace==other.replace&&this.caseSensitive==other.caseSensitive&&this.regexp==other.regexp&&this.wholeWord==other.wholeWord;}/**
      @internal
      */create(){return this.regexp?new RegExpQuery(this):new StringQuery(this);}/**
      Get a search cursor for this query, searching through the given
      range in the given state.
      */getCursor(state,from=0,to){let st=state.doc?state:EditorState.create({doc:state});if(to==null)to=st.doc.length;return this.regexp?regexpCursor(this,st,from,to):stringCursor(this,st,from,to);}}class QueryType{constructor(spec){this.spec=spec;}}function stringCursor(spec,state,from,to){return new SearchCursor(state.doc,spec.unquoted,from,to,spec.caseSensitive?undefined:x=>x.toLowerCase(),spec.wholeWord?stringWordTest(state.doc,state.charCategorizer(state.selection.main.head)):undefined);}function stringWordTest(doc,categorizer){return(from,to,buf,bufPos)=>{if(bufPos>from||bufPos+buf.length<to){bufPos=Math.max(0,from-2);buf=doc.sliceString(bufPos,Math.min(doc.length,to+2));}return(categorizer(charBefore(buf,from-bufPos))!=CharCategory.Word||categorizer(charAfter(buf,from-bufPos))!=CharCategory.Word)&&(categorizer(charAfter(buf,to-bufPos))!=CharCategory.Word||categorizer(charBefore(buf,to-bufPos))!=CharCategory.Word);};}class StringQuery extends QueryType{constructor(spec){super(spec);}nextMatch(state,curFrom,curTo){let cursor=stringCursor(this.spec,state,curTo,state.doc.length).nextOverlapping();if(cursor.done)cursor=stringCursor(this.spec,state,0,curFrom).nextOverlapping();return cursor.done?null:cursor.value;}// Searching in reverse is, rather than implementing an inverted search
// cursor, done by scanning chunk after chunk forward.
prevMatchInRange(state,from,to){for(let pos=to;;){let start=Math.max(from,pos-10000/* FindPrev.ChunkSize */-this.spec.unquoted.length);let cursor=stringCursor(this.spec,state,start,pos),range=null;while(!cursor.nextOverlapping().done)range=cursor.value;if(range)return range;if(start==from)return null;pos-=10000/* FindPrev.ChunkSize */;}}prevMatch(state,curFrom,curTo){return this.prevMatchInRange(state,0,curFrom)||this.prevMatchInRange(state,curTo,state.doc.length);}getReplacement(_result){return this.spec.unquote(this.spec.replace);}matchAll(state,limit){let cursor=stringCursor(this.spec,state,0,state.doc.length),ranges=[];while(!cursor.next().done){if(ranges.length>=limit)return null;ranges.push(cursor.value);}return ranges;}highlight(state,from,to,add){let cursor=stringCursor(this.spec,state,Math.max(0,from-this.spec.unquoted.length),Math.min(to+this.spec.unquoted.length,state.doc.length));while(!cursor.next().done)add(cursor.value.from,cursor.value.to);}}function regexpCursor(spec,state,from,to){return new RegExpCursor(state.doc,spec.search,{ignoreCase:!spec.caseSensitive,test:spec.wholeWord?regexpWordTest(state.charCategorizer(state.selection.main.head)):undefined},from,to);}function charBefore(str,index){return str.slice(findClusterBreak(str,index,false),index);}function charAfter(str,index){return str.slice(index,findClusterBreak(str,index));}function regexpWordTest(categorizer){return(_from,_to,match)=>!match[0].length||(categorizer(charBefore(match.input,match.index))!=CharCategory.Word||categorizer(charAfter(match.input,match.index))!=CharCategory.Word)&&(categorizer(charAfter(match.input,match.index+match[0].length))!=CharCategory.Word||categorizer(charBefore(match.input,match.index+match[0].length))!=CharCategory.Word);}class RegExpQuery extends QueryType{nextMatch(state,curFrom,curTo){let cursor=regexpCursor(this.spec,state,curTo,state.doc.length).next();if(cursor.done)cursor=regexpCursor(this.spec,state,0,curFrom).next();return cursor.done?null:cursor.value;}prevMatchInRange(state,from,to){for(let size=1;;size++){let start=Math.max(from,to-size*10000/* FindPrev.ChunkSize */);let cursor=regexpCursor(this.spec,state,start,to),range=null;while(!cursor.next().done)range=cursor.value;if(range&&(start==from||range.from>start+10))return range;if(start==from)return null;}}prevMatch(state,curFrom,curTo){return this.prevMatchInRange(state,0,curFrom)||this.prevMatchInRange(state,curTo,state.doc.length);}getReplacement(result){return this.spec.unquote(this.spec.replace).replace(/\$([$&\d+])/g,(m,i)=>i=="$"?"$":i=="&"?result.match[0]:i!="0"&&+i<result.match.length?result.match[i]:m);}matchAll(state,limit){let cursor=regexpCursor(this.spec,state,0,state.doc.length),ranges=[];while(!cursor.next().done){if(ranges.length>=limit)return null;ranges.push(cursor.value);}return ranges;}highlight(state,from,to,add){let cursor=regexpCursor(this.spec,state,Math.max(0,from-250/* RegExp.HighlightMargin */),Math.min(to+250/* RegExp.HighlightMargin */,state.doc.length));while(!cursor.next().done)add(cursor.value.from,cursor.value.to);}}/**
  A state effect that updates the current search query. Note that
  this only has an effect if the search state has been initialized
  (by including [`search`](https://codemirror.net/6/docs/ref/#search.search) in your configuration or
  by running [`openSearchPanel`](https://codemirror.net/6/docs/ref/#search.openSearchPanel) at least
  once).
  */const setSearchQuery=/*@__PURE__*/StateEffect.define();const togglePanel$1=/*@__PURE__*/StateEffect.define();const searchState=/*@__PURE__*/StateField.define({create(state){return new SearchState(defaultQuery(state).create(),null);},update(value,tr){for(let effect of tr.effects){if(effect.is(setSearchQuery))value=new SearchState(effect.value.create(),value.panel);else if(effect.is(togglePanel$1))value=new SearchState(value.query,effect.value?createSearchPanel:null);}return value;},provide:f=>showPanel.from(f,val=>val.panel)});class SearchState{constructor(query,panel){this.query=query;this.panel=panel;}}const matchMark=/*@__PURE__*/Decoration.mark({class:"cm-searchMatch"}),selectedMatchMark=/*@__PURE__*/Decoration.mark({class:"cm-searchMatch cm-searchMatch-selected"});const searchHighlighter=/*@__PURE__*/ViewPlugin.fromClass(class{constructor(view){this.view=view;this.decorations=this.highlight(view.state.field(searchState));}update(update){let state=update.state.field(searchState);if(state!=update.startState.field(searchState)||update.docChanged||update.selectionSet||update.viewportChanged)this.decorations=this.highlight(state);}highlight({query,panel}){if(!panel||!query.spec.valid)return Decoration.none;let{view}=this;let builder=new RangeSetBuilder();for(let i=0,ranges=view.visibleRanges,l=ranges.length;i<l;i++){let{from,to}=ranges[i];while(i<l-1&&to>ranges[i+1].from-2*250/* RegExp.HighlightMargin */)to=ranges[++i].to;query.highlight(view.state,from,to,(from,to)=>{let selected=view.state.selection.ranges.some(r=>r.from==from&&r.to==to);builder.add(from,to,selected?selectedMatchMark:matchMark);});}return builder.finish();}},{decorations:v=>v.decorations});function searchCommand(f){return view=>{let state=view.state.field(searchState,false);return state&&state.query.spec.valid?f(view,state):openSearchPanel(view);};}/**
  Open the search panel if it isn't already open, and move the
  selection to the first match after the current main selection.
  Will wrap around to the start of the document when it reaches the
  end.
  */const findNext=/*@__PURE__*/searchCommand((view,{query})=>{let{to}=view.state.selection.main;let next=query.nextMatch(view.state,to,to);if(!next)return false;let selection=EditorSelection.single(next.from,next.to);let config=view.state.facet(searchConfigFacet);view.dispatch({selection,effects:[announceMatch(view,next),config.scrollToMatch(selection.main,view)],userEvent:"select.search"});selectSearchInput(view);return true;});/**
  Move the selection to the previous instance of the search query,
  before the current main selection. Will wrap past the start
  of the document to start searching at the end again.
  */const findPrevious=/*@__PURE__*/searchCommand((view,{query})=>{let{state}=view,{from}=state.selection.main;let prev=query.prevMatch(state,from,from);if(!prev)return false;let selection=EditorSelection.single(prev.from,prev.to);let config=view.state.facet(searchConfigFacet);view.dispatch({selection,effects:[announceMatch(view,prev),config.scrollToMatch(selection.main,view)],userEvent:"select.search"});selectSearchInput(view);return true;});/**
  Select all instances of the search query.
  */const selectMatches=/*@__PURE__*/searchCommand((view,{query})=>{let ranges=query.matchAll(view.state,1000);if(!ranges||!ranges.length)return false;view.dispatch({selection:EditorSelection.create(ranges.map(r=>EditorSelection.range(r.from,r.to))),userEvent:"select.search.matches"});return true;});/**
  Select all instances of the currently selected text.
  */const selectSelectionMatches=({state,dispatch})=>{let sel=state.selection;if(sel.ranges.length>1||sel.main.empty)return false;let{from,to}=sel.main;let ranges=[],main=0;for(let cur=new SearchCursor(state.doc,state.sliceDoc(from,to));!cur.next().done;){if(ranges.length>1000)return false;if(cur.value.from==from)main=ranges.length;ranges.push(EditorSelection.range(cur.value.from,cur.value.to));}dispatch(state.update({selection:EditorSelection.create(ranges,main),userEvent:"select.search.matches"}));return true;};/**
  Replace the current match of the search query.
  */const replaceNext=/*@__PURE__*/searchCommand((view,{query})=>{let{state}=view,{from,to}=state.selection.main;if(state.readOnly)return false;let next=query.nextMatch(state,from,from);if(!next)return false;let changes=[],selection,replacement;let effects=[];if(next.from==from&&next.to==to){replacement=state.toText(query.getReplacement(next));changes.push({from:next.from,to:next.to,insert:replacement});next=query.nextMatch(state,next.from,next.to);effects.push(EditorView.announce.of(state.phrase("replaced match on line $",state.doc.lineAt(from).number)+"."));}if(next){let off=changes.length==0||changes[0].from>=next.to?0:next.to-next.from-replacement.length;selection=EditorSelection.single(next.from-off,next.to-off);effects.push(announceMatch(view,next));effects.push(state.facet(searchConfigFacet).scrollToMatch(selection.main,view));}view.dispatch({changes,selection,effects,userEvent:"input.replace"});return true;});/**
  Replace all instances of the search query with the given
  replacement.
  */const replaceAll=/*@__PURE__*/searchCommand((view,{query})=>{if(view.state.readOnly)return false;let changes=query.matchAll(view.state,1e9).map(match=>{let{from,to}=match;return{from,to,insert:query.getReplacement(match)};});if(!changes.length)return false;let announceText=view.state.phrase("replaced $ matches",changes.length)+".";view.dispatch({changes,effects:EditorView.announce.of(announceText),userEvent:"input.replace.all"});return true;});function createSearchPanel(view){return view.state.facet(searchConfigFacet).createPanel(view);}function defaultQuery(state,fallback){var _a,_b,_c,_d,_e;let sel=state.selection.main;let selText=sel.empty||sel.to>sel.from+100?"":state.sliceDoc(sel.from,sel.to);if(fallback&&!selText)return fallback;let config=state.facet(searchConfigFacet);return new SearchQuery({search:((_a=fallback===null||fallback===void 0?void 0:fallback.literal)!==null&&_a!==void 0?_a:config.literal)?selText:selText.replace(/\n/g,"\\n"),caseSensitive:(_b=fallback===null||fallback===void 0?void 0:fallback.caseSensitive)!==null&&_b!==void 0?_b:config.caseSensitive,literal:(_c=fallback===null||fallback===void 0?void 0:fallback.literal)!==null&&_c!==void 0?_c:config.literal,regexp:(_d=fallback===null||fallback===void 0?void 0:fallback.regexp)!==null&&_d!==void 0?_d:config.regexp,wholeWord:(_e=fallback===null||fallback===void 0?void 0:fallback.wholeWord)!==null&&_e!==void 0?_e:config.wholeWord});}function getSearchInput(view){let panel=getPanel(view,createSearchPanel);return panel&&panel.dom.querySelector("[main-field]");}function selectSearchInput(view){let input=getSearchInput(view);if(input&&input==view.root.activeElement)input.select();}/**
  Make sure the search panel is open and focused.
  */const openSearchPanel=view=>{let state=view.state.field(searchState,false);if(state&&state.panel){let searchInput=getSearchInput(view);if(searchInput&&searchInput!=view.root.activeElement){let query=defaultQuery(view.state,state.query.spec);if(query.valid)view.dispatch({effects:setSearchQuery.of(query)});searchInput.focus();searchInput.select();}}else{view.dispatch({effects:[togglePanel$1.of(true),state?setSearchQuery.of(defaultQuery(view.state,state.query.spec)):StateEffect.appendConfig.of(searchExtensions)]});}return true;};/**
  Close the search panel.
  */const closeSearchPanel=view=>{let state=view.state.field(searchState,false);if(!state||!state.panel)return false;let panel=getPanel(view,createSearchPanel);if(panel&&panel.dom.contains(view.root.activeElement))view.focus();view.dispatch({effects:togglePanel$1.of(false)});return true;};/**
  Default search-related key bindings.

   - Mod-f: [`openSearchPanel`](https://codemirror.net/6/docs/ref/#search.openSearchPanel)
   - F3, Mod-g: [`findNext`](https://codemirror.net/6/docs/ref/#search.findNext)
   - Shift-F3, Shift-Mod-g: [`findPrevious`](https://codemirror.net/6/docs/ref/#search.findPrevious)
   - Mod-Alt-g: [`gotoLine`](https://codemirror.net/6/docs/ref/#search.gotoLine)
   - Mod-d: [`selectNextOccurrence`](https://codemirror.net/6/docs/ref/#search.selectNextOccurrence)
  */const searchKeymap=[{key:"Mod-f",run:openSearchPanel,scope:"editor search-panel"},{key:"F3",run:findNext,shift:findPrevious,scope:"editor search-panel",preventDefault:true},{key:"Mod-g",run:findNext,shift:findPrevious,scope:"editor search-panel",preventDefault:true},{key:"Escape",run:closeSearchPanel,scope:"editor search-panel"},{key:"Mod-Shift-l",run:selectSelectionMatches},{key:"Mod-Alt-g",run:gotoLine},{key:"Mod-d",run:selectNextOccurrence,preventDefault:true}];class SearchPanel{constructor(view){this.view=view;let query=this.query=view.state.field(searchState).query.spec;this.commit=this.commit.bind(this);this.searchField=crelt("input",{value:query.search,placeholder:phrase(view,"Find"),"aria-label":phrase(view,"Find"),class:"cm-textfield",name:"search",form:"","main-field":"true",onchange:this.commit,onkeyup:this.commit});this.replaceField=crelt("input",{value:query.replace,placeholder:phrase(view,"Replace"),"aria-label":phrase(view,"Replace"),class:"cm-textfield",name:"replace",form:"",onchange:this.commit,onkeyup:this.commit});this.caseField=crelt("input",{type:"checkbox",name:"case",form:"",checked:query.caseSensitive,onchange:this.commit});this.reField=crelt("input",{type:"checkbox",name:"re",form:"",checked:query.regexp,onchange:this.commit});this.wordField=crelt("input",{type:"checkbox",name:"word",form:"",checked:query.wholeWord,onchange:this.commit});function button(name,onclick,content){return crelt("button",{class:"cm-button",name,onclick,type:"button"},content);}this.dom=crelt("div",{onkeydown:e=>this.keydown(e),class:"cm-search"},[this.searchField,button("next",()=>findNext(view),[phrase(view,"next")]),button("prev",()=>findPrevious(view),[phrase(view,"previous")]),button("select",()=>selectMatches(view),[phrase(view,"all")]),crelt("label",null,[this.caseField,phrase(view,"match case")]),crelt("label",null,[this.reField,phrase(view,"regexp")]),crelt("label",null,[this.wordField,phrase(view,"by word")]),...(view.state.readOnly?[]:[crelt("br"),this.replaceField,button("replace",()=>replaceNext(view),[phrase(view,"replace")]),button("replaceAll",()=>replaceAll(view),[phrase(view,"replace all")])]),crelt("button",{name:"close",onclick:()=>closeSearchPanel(view),"aria-label":phrase(view,"close"),type:"button"},["×"])]);}commit(){let query=new SearchQuery({search:this.searchField.value,caseSensitive:this.caseField.checked,regexp:this.reField.checked,wholeWord:this.wordField.checked,replace:this.replaceField.value});if(!query.eq(this.query)){this.query=query;this.view.dispatch({effects:setSearchQuery.of(query)});}}keydown(e){if(runScopeHandlers(this.view,e,"search-panel")){e.preventDefault();}else if(e.keyCode==13&&e.target==this.searchField){e.preventDefault();(e.shiftKey?findPrevious:findNext)(this.view);}else if(e.keyCode==13&&e.target==this.replaceField){e.preventDefault();replaceNext(this.view);}}update(update){for(let tr of update.transactions)for(let effect of tr.effects){if(effect.is(setSearchQuery)&&!effect.value.eq(this.query))this.setQuery(effect.value);}}setQuery(query){this.query=query;this.searchField.value=query.search;this.replaceField.value=query.replace;this.caseField.checked=query.caseSensitive;this.reField.checked=query.regexp;this.wordField.checked=query.wholeWord;}mount(){this.searchField.select();}get pos(){return 80;}get top(){return this.view.state.facet(searchConfigFacet).top;}}function phrase(view,phrase){return view.state.phrase(phrase);}const AnnounceMargin=30;const Break=/[\s\.,:;?!]/;function announceMatch(view,{from,to}){let line=view.state.doc.lineAt(from),lineEnd=view.state.doc.lineAt(to).to;let start=Math.max(line.from,from-AnnounceMargin),end=Math.min(lineEnd,to+AnnounceMargin);let text=view.state.sliceDoc(start,end);if(start!=line.from){for(let i=0;i<AnnounceMargin;i++)if(!Break.test(text[i+1])&&Break.test(text[i])){text=text.slice(i);break;}}if(end!=lineEnd){for(let i=text.length-1;i>text.length-AnnounceMargin;i--)if(!Break.test(text[i-1])&&Break.test(text[i])){text=text.slice(0,i);break;}}return EditorView.announce.of(`${view.state.phrase("current match")}. ${text} ${view.state.phrase("on line")} ${line.number}.`);}const baseTheme$2=/*@__PURE__*/EditorView.baseTheme({".cm-panel.cm-search":{padding:"2px 6px 4px",position:"relative","& [name=close]":{position:"absolute",top:"0",right:"4px",backgroundColor:"inherit",border:"none",font:"inherit",padding:0,margin:0},"& input, & button, & label":{margin:".2em .6em .2em 0"},"& input[type=checkbox]":{marginRight:".2em"},"& label":{fontSize:"80%",whiteSpace:"pre"}},"&light .cm-searchMatch":{backgroundColor:"#ffff0054"},"&dark .cm-searchMatch":{backgroundColor:"#00ffff8a"},"&light .cm-searchMatch-selected":{backgroundColor:"#ff6a0054"},"&dark .cm-searchMatch-selected":{backgroundColor:"#ff00ff8a"}});const searchExtensions=[searchState,/*@__PURE__*/Prec.low(searchHighlighter),baseTheme$2];/**
  An instance of this is passed to completion source functions.
  */class CompletionContext{/**
      Create a new completion context. (Mostly useful for testing
      completion sources—in the editor, the extension will create
      these for you.)
      */constructor(/**
      The editor state that the completion happens in.
      */state,/**
      The position at which the completion is happening.
      */pos,/**
      Indicates whether completion was activated explicitly, or
      implicitly by typing. The usual way to respond to this is to
      only return completions when either there is part of a
      completable entity before the cursor, or `explicit` is true.
      */explicit){this.state=state;this.pos=pos;this.explicit=explicit;/**
          @internal
          */this.abortListeners=[];}/**
      Get the extent, content, and (if there is a token) type of the
      token before `this.pos`.
      */tokenBefore(types){let token=syntaxTree(this.state).resolveInner(this.pos,-1);while(token&&types.indexOf(token.name)<0)token=token.parent;return token?{from:token.from,to:this.pos,text:this.state.sliceDoc(token.from,this.pos),type:token.type}:null;}/**
      Get the match of the given expression directly before the
      cursor.
      */matchBefore(expr){let line=this.state.doc.lineAt(this.pos);let start=Math.max(line.from,this.pos-250);let str=line.text.slice(start-line.from,this.pos-line.from);let found=str.search(ensureAnchor(expr,false));return found<0?null:{from:start+found,to:this.pos,text:str.slice(found)};}/**
      Yields true when the query has been aborted. Can be useful in
      asynchronous queries to avoid doing work that will be ignored.
      */get aborted(){return this.abortListeners==null;}/**
      Allows you to register abort handlers, which will be called when
      the query is
      [aborted](https://codemirror.net/6/docs/ref/#autocomplete.CompletionContext.aborted).
      */addEventListener(type,listener){if(type=="abort"&&this.abortListeners)this.abortListeners.push(listener);}}function toSet(chars){let flat=Object.keys(chars).join("");let words=/\w/.test(flat);if(words)flat=flat.replace(/\w/g,"");return`[${words?"\\w":""}${flat.replace(/[^\w\s]/g,"\\$&")}]`;}function prefixMatch(options){let first=Object.create(null),rest=Object.create(null);for(let{label}of options){first[label[0]]=true;for(let i=1;i<label.length;i++)rest[label[i]]=true;}let source=toSet(first)+toSet(rest)+"*$";return[new RegExp("^"+source),new RegExp(source)];}/**
  Given a a fixed array of options, return an autocompleter that
  completes them.
  */function completeFromList(list){let options=list.map(o=>typeof o=="string"?{label:o}:o);let[validFor,match]=options.every(o=>/^\w+$/.test(o.label))?[/\w*$/,/\w+$/]:prefixMatch(options);return context=>{let token=context.matchBefore(match);return token||context.explicit?{from:token?token.from:context.pos,options,validFor}:null;};}/**
  Wrap the given completion source so that it will not fire when the
  cursor is in a syntax node with one of the given names.
  */function ifNotIn(nodes,source){return context=>{for(let pos=syntaxTree(context.state).resolveInner(context.pos,-1);pos;pos=pos.parent){if(nodes.indexOf(pos.name)>-1)return null;if(pos.type.isTop)break;}return source(context);};}class Option{constructor(completion,source,match,score){this.completion=completion;this.source=source;this.match=match;this.score=score;}}function cur(state){return state.selection.main.from;}// Make sure the given regexp has a $ at its end and, if `start` is
// true, a ^ at its start.
function ensureAnchor(expr,start){var _a;let{source}=expr;let addStart=start&&source[0]!="^",addEnd=source[source.length-1]!="$";if(!addStart&&!addEnd)return expr;return new RegExp(`${addStart?"^":""}(?:${source})${addEnd?"$":""}`,(_a=expr.flags)!==null&&_a!==void 0?_a:expr.ignoreCase?"i":"");}/**
  This annotation is added to transactions that are produced by
  picking a completion.
  */const pickedCompletion=/*@__PURE__*/Annotation.define();/**
  Helper function that returns a transaction spec which inserts a
  completion's text in the main selection range, and any other
  selection range that has the same text in front of it.
  */function insertCompletionText(state,text,from,to){let{main}=state.selection,fromOff=from-main.from,toOff=to-main.from;return Object.assign(Object.assign({},state.changeByRange(range=>{if(range!=main&&from!=to&&state.sliceDoc(range.from+fromOff,range.from+toOff)!=state.sliceDoc(from,to))return{range};return{changes:{from:range.from+fromOff,to:to==main.from?range.to:range.from+toOff,insert:text},range:EditorSelection.cursor(range.from+fromOff+text.length)};})),{scrollIntoView:true,userEvent:"input.complete"});}const SourceCache=/*@__PURE__*/new WeakMap();function asSource(source){if(!Array.isArray(source))return source;let known=SourceCache.get(source);if(!known)SourceCache.set(source,known=completeFromList(source));return known;}const startCompletionEffect=/*@__PURE__*/StateEffect.define();const closeCompletionEffect=/*@__PURE__*/StateEffect.define();// A pattern matcher for fuzzy completion matching. Create an instance
// once for a pattern, and then use that to match any number of
// completions.
class FuzzyMatcher{constructor(pattern){this.pattern=pattern;this.chars=[];this.folded=[];// Buffers reused by calls to `match` to track matched character
// positions.
this.any=[];this.precise=[];this.byWord=[];this.score=0;this.matched=[];for(let p=0;p<pattern.length;){let char=codePointAt(pattern,p),size=codePointSize(char);this.chars.push(char);let part=pattern.slice(p,p+size),upper=part.toUpperCase();this.folded.push(codePointAt(upper==part?part.toLowerCase():upper,0));p+=size;}this.astral=pattern.length!=this.chars.length;}ret(score,matched){this.score=score;this.matched=matched;return true;}// Matches a given word (completion) against the pattern (input).
// Will return a boolean indicating whether there was a match and,
// on success, set `this.score` to the score, `this.matched` to an
// array of `from, to` pairs indicating the matched parts of `word`.
//
// The score is a number that is more negative the worse the match
// is. See `Penalty` above.
match(word){if(this.pattern.length==0)return this.ret(-100/* Penalty.NotFull */,[]);if(word.length<this.pattern.length)return false;let{chars,folded,any,precise,byWord}=this;// For single-character queries, only match when they occur right
// at the start
if(chars.length==1){let first=codePointAt(word,0),firstSize=codePointSize(first);let score=firstSize==word.length?0:-100/* Penalty.NotFull */;if(first==chars[0]);else if(first==folded[0])score+=-200/* Penalty.CaseFold */;else return false;return this.ret(score,[0,firstSize]);}let direct=word.indexOf(this.pattern);if(direct==0)return this.ret(word.length==this.pattern.length?0:-100/* Penalty.NotFull */,[0,this.pattern.length]);let len=chars.length,anyTo=0;if(direct<0){for(let i=0,e=Math.min(word.length,200);i<e&&anyTo<len;){let next=codePointAt(word,i);if(next==chars[anyTo]||next==folded[anyTo])any[anyTo++]=i;i+=codePointSize(next);}// No match, exit immediately
if(anyTo<len)return false;}// This tracks the extent of the precise (non-folded, not
// necessarily adjacent) match
let preciseTo=0;// Tracks whether there is a match that hits only characters that
// appear to be starting words. `byWordFolded` is set to true when
// a case folded character is encountered in such a match
let byWordTo=0,byWordFolded=false;// If we've found a partial adjacent match, these track its state
let adjacentTo=0,adjacentStart=-1,adjacentEnd=-1;let hasLower=/[a-z]/.test(word),wordAdjacent=true;// Go over the option's text, scanning for the various kinds of matches
for(let i=0,e=Math.min(word.length,200),prevType=0/* Tp.NonWord */;i<e&&byWordTo<len;){let next=codePointAt(word,i);if(direct<0){if(preciseTo<len&&next==chars[preciseTo])precise[preciseTo++]=i;if(adjacentTo<len){if(next==chars[adjacentTo]||next==folded[adjacentTo]){if(adjacentTo==0)adjacentStart=i;adjacentEnd=i+1;adjacentTo++;}else{adjacentTo=0;}}}let ch,type=next<0xff?next>=48&&next<=57||next>=97&&next<=122?2/* Tp.Lower */:next>=65&&next<=90?1/* Tp.Upper */:0/* Tp.NonWord */:(ch=fromCodePoint(next))!=ch.toLowerCase()?1/* Tp.Upper */:ch!=ch.toUpperCase()?2/* Tp.Lower */:0/* Tp.NonWord */;if(!i||type==1/* Tp.Upper */&&hasLower||prevType==0/* Tp.NonWord */&&type!=0/* Tp.NonWord */){if(chars[byWordTo]==next||folded[byWordTo]==next&&(byWordFolded=true))byWord[byWordTo++]=i;else if(byWord.length)wordAdjacent=false;}prevType=type;i+=codePointSize(next);}if(byWordTo==len&&byWord[0]==0&&wordAdjacent)return this.result(-100/* Penalty.ByWord */+(byWordFolded?-200/* Penalty.CaseFold */:0),byWord,word);if(adjacentTo==len&&adjacentStart==0)return this.ret(-200/* Penalty.CaseFold */-word.length+(adjacentEnd==word.length?0:-100/* Penalty.NotFull */),[0,adjacentEnd]);if(direct>-1)return this.ret(-700/* Penalty.NotStart */-word.length,[direct,direct+this.pattern.length]);if(adjacentTo==len)return this.ret(-200/* Penalty.CaseFold */+-700/* Penalty.NotStart */-word.length,[adjacentStart,adjacentEnd]);if(byWordTo==len)return this.result(-100/* Penalty.ByWord */+(byWordFolded?-200/* Penalty.CaseFold */:0)+-700/* Penalty.NotStart */+(wordAdjacent?0:-1100/* Penalty.Gap */),byWord,word);return chars.length==2?false:this.result((any[0]?-700/* Penalty.NotStart */:0)+-200/* Penalty.CaseFold */+-1100/* Penalty.Gap */,any,word);}result(score,positions,word){let result=[],i=0;for(let pos of positions){let to=pos+(this.astral?codePointSize(codePointAt(word,pos)):1);if(i&&result[i-1]==pos)result[i-1]=to;else{result[i++]=pos;result[i++]=to;}}return this.ret(score-word.length,result);}}const completionConfig=/*@__PURE__*/Facet.define({combine(configs){return combineConfig(configs,{activateOnTyping:true,activateOnTypingDelay:100,selectOnOpen:true,override:null,closeOnBlur:true,maxRenderedOptions:100,defaultKeymap:true,tooltipClass:()=>"",optionClass:()=>"",aboveCursor:false,icons:true,addToOptions:[],positionInfo:defaultPositionInfo,compareCompletions:(a,b)=>a.label.localeCompare(b.label),interactionDelay:75,updateSyncTime:100},{defaultKeymap:(a,b)=>a&&b,closeOnBlur:(a,b)=>a&&b,icons:(a,b)=>a&&b,tooltipClass:(a,b)=>c=>joinClass(a(c),b(c)),optionClass:(a,b)=>c=>joinClass(a(c),b(c)),addToOptions:(a,b)=>a.concat(b)});}});function joinClass(a,b){return a?b?a+" "+b:a:b;}function defaultPositionInfo(view,list,option,info,space,tooltip){let rtl=view.textDirection==Direction.RTL,left=rtl,narrow=false;let side="top",offset,maxWidth;let spaceLeft=list.left-space.left,spaceRight=space.right-list.right;let infoWidth=info.right-info.left,infoHeight=info.bottom-info.top;if(left&&spaceLeft<Math.min(infoWidth,spaceRight))left=false;else if(!left&&spaceRight<Math.min(infoWidth,spaceLeft))left=true;if(infoWidth<=(left?spaceLeft:spaceRight)){offset=Math.max(space.top,Math.min(option.top,space.bottom-infoHeight))-list.top;maxWidth=Math.min(400/* Info.Width */,left?spaceLeft:spaceRight);}else{narrow=true;maxWidth=Math.min(400/* Info.Width */,(rtl?list.right:space.right-list.left)-30/* Info.Margin */);let spaceBelow=space.bottom-list.bottom;if(spaceBelow>=infoHeight||spaceBelow>list.top){// Below the completion
offset=option.bottom-list.top;}else{// Above it
side="bottom";offset=list.bottom-option.top;}}let scaleY=(list.bottom-list.top)/tooltip.offsetHeight;let scaleX=(list.right-list.left)/tooltip.offsetWidth;return{style:`${side}: ${offset/scaleY}px; max-width: ${maxWidth/scaleX}px`,class:"cm-completionInfo-"+(narrow?rtl?"left-narrow":"right-narrow":left?"left":"right")};}function optionContent(config){let content=config.addToOptions.slice();if(config.icons)content.push({render(completion){let icon=document.createElement("div");icon.classList.add("cm-completionIcon");if(completion.type)icon.classList.add(...completion.type.split(/\s+/g).map(cls=>"cm-completionIcon-"+cls));icon.setAttribute("aria-hidden","true");return icon;},position:20});content.push({render(completion,_s,_v,match){let labelElt=document.createElement("span");labelElt.className="cm-completionLabel";let label=completion.displayLabel||completion.label,off=0;for(let j=0;j<match.length;){let from=match[j++],to=match[j++];if(from>off)labelElt.appendChild(document.createTextNode(label.slice(off,from)));let span=labelElt.appendChild(document.createElement("span"));span.appendChild(document.createTextNode(label.slice(from,to)));span.className="cm-completionMatchedText";off=to;}if(off<label.length)labelElt.appendChild(document.createTextNode(label.slice(off)));return labelElt;},position:50},{render(completion){if(!completion.detail)return null;let detailElt=document.createElement("span");detailElt.className="cm-completionDetail";detailElt.textContent=completion.detail;return detailElt;},position:80});return content.sort((a,b)=>a.position-b.position).map(a=>a.render);}function rangeAroundSelected(total,selected,max){if(total<=max)return{from:0,to:total};if(selected<0)selected=0;if(selected<=total>>1){let off=Math.floor(selected/max);return{from:off*max,to:(off+1)*max};}let off=Math.floor((total-selected)/max);return{from:total-(off+1)*max,to:total-off*max};}class CompletionTooltip{constructor(view,stateField,applyCompletion){this.view=view;this.stateField=stateField;this.applyCompletion=applyCompletion;this.info=null;this.infoDestroy=null;this.placeInfoReq={read:()=>this.measureInfo(),write:pos=>this.placeInfo(pos),key:this};this.space=null;this.currentClass="";let cState=view.state.field(stateField);let{options,selected}=cState.open;let config=view.state.facet(completionConfig);this.optionContent=optionContent(config);this.optionClass=config.optionClass;this.tooltipClass=config.tooltipClass;this.range=rangeAroundSelected(options.length,selected,config.maxRenderedOptions);this.dom=document.createElement("div");this.dom.className="cm-tooltip-autocomplete";this.updateTooltipClass(view.state);this.dom.addEventListener("mousedown",e=>{let{options}=view.state.field(stateField).open;for(let dom=e.target,match;dom&&dom!=this.dom;dom=dom.parentNode){if(dom.nodeName=="LI"&&(match=/-(\d+)$/.exec(dom.id))&&+match[1]<options.length){this.applyCompletion(view,options[+match[1]]);e.preventDefault();return;}}});this.dom.addEventListener("focusout",e=>{let state=view.state.field(this.stateField,false);if(state&&state.tooltip&&view.state.facet(completionConfig).closeOnBlur&&e.relatedTarget!=view.contentDOM)view.dispatch({effects:closeCompletionEffect.of(null)});});this.showOptions(options,cState.id);}mount(){this.updateSel();}showOptions(options,id){if(this.list)this.list.remove();this.list=this.dom.appendChild(this.createListBox(options,id,this.range));this.list.addEventListener("scroll",()=>{if(this.info)this.view.requestMeasure(this.placeInfoReq);});}update(update){var _a;let cState=update.state.field(this.stateField);let prevState=update.startState.field(this.stateField);this.updateTooltipClass(update.state);if(cState!=prevState){let{options,selected,disabled}=cState.open;if(!prevState.open||prevState.open.options!=options){this.range=rangeAroundSelected(options.length,selected,update.state.facet(completionConfig).maxRenderedOptions);this.showOptions(options,cState.id);}this.updateSel();if(disabled!=((_a=prevState.open)===null||_a===void 0?void 0:_a.disabled))this.dom.classList.toggle("cm-tooltip-autocomplete-disabled",!!disabled);}}updateTooltipClass(state){let cls=this.tooltipClass(state);if(cls!=this.currentClass){for(let c of this.currentClass.split(" "))if(c)this.dom.classList.remove(c);for(let c of cls.split(" "))if(c)this.dom.classList.add(c);this.currentClass=cls;}}positioned(space){this.space=space;if(this.info)this.view.requestMeasure(this.placeInfoReq);}updateSel(){let cState=this.view.state.field(this.stateField),open=cState.open;if(open.selected>-1&&open.selected<this.range.from||open.selected>=this.range.to){this.range=rangeAroundSelected(open.options.length,open.selected,this.view.state.facet(completionConfig).maxRenderedOptions);this.showOptions(open.options,cState.id);}if(this.updateSelectedOption(open.selected)){this.destroyInfo();let{completion}=open.options[open.selected];let{info}=completion;if(!info)return;let infoResult=typeof info==="string"?document.createTextNode(info):info(completion);if(!infoResult)return;if("then"in infoResult){infoResult.then(obj=>{if(obj&&this.view.state.field(this.stateField,false)==cState)this.addInfoPane(obj,completion);}).catch(e=>logException(this.view.state,e,"completion info"));}else{this.addInfoPane(infoResult,completion);}}}addInfoPane(content,completion){this.destroyInfo();let wrap=this.info=document.createElement("div");wrap.className="cm-tooltip cm-completionInfo";if(content.nodeType!=null){wrap.appendChild(content);this.infoDestroy=null;}else{let{dom,destroy}=content;wrap.appendChild(dom);this.infoDestroy=destroy||null;}this.dom.appendChild(wrap);this.view.requestMeasure(this.placeInfoReq);}updateSelectedOption(selected){let set=null;for(let opt=this.list.firstChild,i=this.range.from;opt;opt=opt.nextSibling,i++){if(opt.nodeName!="LI"||!opt.id){i--;// A section header
}else if(i==selected){if(!opt.hasAttribute("aria-selected")){opt.setAttribute("aria-selected","true");set=opt;}}else{if(opt.hasAttribute("aria-selected"))opt.removeAttribute("aria-selected");}}if(set)scrollIntoView(this.list,set);return set;}measureInfo(){let sel=this.dom.querySelector("[aria-selected]");if(!sel||!this.info)return null;let listRect=this.dom.getBoundingClientRect();let infoRect=this.info.getBoundingClientRect();let selRect=sel.getBoundingClientRect();let space=this.space;if(!space){let win=this.dom.ownerDocument.defaultView||window;space={left:0,top:0,right:win.innerWidth,bottom:win.innerHeight};}if(selRect.top>Math.min(space.bottom,listRect.bottom)-10||selRect.bottom<Math.max(space.top,listRect.top)+10)return null;return this.view.state.facet(completionConfig).positionInfo(this.view,listRect,selRect,infoRect,space,this.dom);}placeInfo(pos){if(this.info){if(pos){if(pos.style)this.info.style.cssText=pos.style;this.info.className="cm-tooltip cm-completionInfo "+(pos.class||"");}else{this.info.style.cssText="top: -1e6px";}}}createListBox(options,id,range){const ul=document.createElement("ul");ul.id=id;ul.setAttribute("role","listbox");ul.setAttribute("aria-expanded","true");ul.setAttribute("aria-label",this.view.state.phrase("Completions"));let curSection=null;for(let i=range.from;i<range.to;i++){let{completion,match}=options[i],{section}=completion;if(section){let name=typeof section=="string"?section:section.name;if(name!=curSection&&(i>range.from||range.from==0)){curSection=name;if(typeof section!="string"&&section.header){ul.appendChild(section.header(section));}else{let header=ul.appendChild(document.createElement("completion-section"));header.textContent=name;}}}const li=ul.appendChild(document.createElement("li"));li.id=id+"-"+i;li.setAttribute("role","option");let cls=this.optionClass(completion);if(cls)li.className=cls;for(let source of this.optionContent){let node=source(completion,this.view.state,this.view,match);if(node)li.appendChild(node);}}if(range.from)ul.classList.add("cm-completionListIncompleteTop");if(range.to<options.length)ul.classList.add("cm-completionListIncompleteBottom");return ul;}destroyInfo(){if(this.info){if(this.infoDestroy)this.infoDestroy();this.info.remove();this.info=null;}}destroy(){this.destroyInfo();}}function completionTooltip(stateField,applyCompletion){return view=>new CompletionTooltip(view,stateField,applyCompletion);}function scrollIntoView(container,element){let parent=container.getBoundingClientRect();let self=element.getBoundingClientRect();let scaleY=parent.height/container.offsetHeight;if(self.top<parent.top)container.scrollTop-=(parent.top-self.top)/scaleY;else if(self.bottom>parent.bottom)container.scrollTop+=(self.bottom-parent.bottom)/scaleY;}// Used to pick a preferred option when two options with the same
// label occur in the result.
function score(option){return(option.boost||0)*100+(option.apply?10:0)+(option.info?5:0)+(option.type?1:0);}function sortOptions(active,state){let options=[];let sections=null;let addOption=option=>{options.push(option);let{section}=option.completion;if(section){if(!sections)sections=[];let name=typeof section=="string"?section:section.name;if(!sections.some(s=>s.name==name))sections.push(typeof section=="string"?{name}:section);}};for(let a of active)if(a.hasResult()){let getMatch=a.result.getMatch;if(a.result.filter===false){for(let option of a.result.options){addOption(new Option(option,a.source,getMatch?getMatch(option):[],1e9-options.length));}}else{let matcher=new FuzzyMatcher(state.sliceDoc(a.from,a.to));for(let option of a.result.options)if(matcher.match(option.label)){let matched=!option.displayLabel?matcher.matched:getMatch?getMatch(option,matcher.matched):[];addOption(new Option(option,a.source,matched,matcher.score+(option.boost||0)));}}}if(sections){let sectionOrder=Object.create(null),pos=0;let cmp=(a,b)=>{var _a,_b;return((_a=a.rank)!==null&&_a!==void 0?_a:1e9)-((_b=b.rank)!==null&&_b!==void 0?_b:1e9)||(a.name<b.name?-1:1);};for(let s of sections.sort(cmp)){pos-=1e5;sectionOrder[s.name]=pos;}for(let option of options){let{section}=option.completion;if(section)option.score+=sectionOrder[typeof section=="string"?section:section.name];}}let result=[],prev=null;let compare=state.facet(completionConfig).compareCompletions;for(let opt of options.sort((a,b)=>b.score-a.score||compare(a.completion,b.completion))){let cur=opt.completion;if(!prev||prev.label!=cur.label||prev.detail!=cur.detail||prev.type!=null&&cur.type!=null&&prev.type!=cur.type||prev.apply!=cur.apply||prev.boost!=cur.boost)result.push(opt);else if(score(opt.completion)>score(prev))result[result.length-1]=opt;prev=opt.completion;}return result;}class CompletionDialog{constructor(options,attrs,tooltip,timestamp,selected,disabled){this.options=options;this.attrs=attrs;this.tooltip=tooltip;this.timestamp=timestamp;this.selected=selected;this.disabled=disabled;}setSelected(selected,id){return selected==this.selected||selected>=this.options.length?this:new CompletionDialog(this.options,makeAttrs(id,selected),this.tooltip,this.timestamp,selected,this.disabled);}static build(active,state,id,prev,conf){let options=sortOptions(active,state);if(!options.length){return prev&&active.some(a=>a.state==1/* State.Pending */)?new CompletionDialog(prev.options,prev.attrs,prev.tooltip,prev.timestamp,prev.selected,true):null;}let selected=state.facet(completionConfig).selectOnOpen?0:-1;if(prev&&prev.selected!=selected&&prev.selected!=-1){let selectedValue=prev.options[prev.selected].completion;for(let i=0;i<options.length;i++)if(options[i].completion==selectedValue){selected=i;break;}}return new CompletionDialog(options,makeAttrs(id,selected),{pos:active.reduce((a,b)=>b.hasResult()?Math.min(a,b.from):a,1e8),create:createTooltip,above:conf.aboveCursor},prev?prev.timestamp:Date.now(),selected,false);}map(changes){return new CompletionDialog(this.options,this.attrs,Object.assign(Object.assign({},this.tooltip),{pos:changes.mapPos(this.tooltip.pos)}),this.timestamp,this.selected,this.disabled);}}class CompletionState{constructor(active,id,open){this.active=active;this.id=id;this.open=open;}static start(){return new CompletionState(none,"cm-ac-"+Math.floor(Math.random()*2e6).toString(36),null);}update(tr){let{state}=tr,conf=state.facet(completionConfig);let sources=conf.override||state.languageDataAt("autocomplete",cur(state)).map(asSource);let active=sources.map(source=>{let value=this.active.find(s=>s.source==source)||new ActiveSource(source,this.active.some(a=>a.state!=0/* State.Inactive */)?1/* State.Pending */:0/* State.Inactive */);return value.update(tr,conf);});if(active.length==this.active.length&&active.every((a,i)=>a==this.active[i]))active=this.active;let open=this.open;if(open&&tr.docChanged)open=open.map(tr.changes);if(tr.selection||active.some(a=>a.hasResult()&&tr.changes.touchesRange(a.from,a.to))||!sameResults(active,this.active))open=CompletionDialog.build(active,state,this.id,open,conf);else if(open&&open.disabled&&!active.some(a=>a.state==1/* State.Pending */))open=null;if(!open&&active.every(a=>a.state!=1/* State.Pending */)&&active.some(a=>a.hasResult()))active=active.map(a=>a.hasResult()?new ActiveSource(a.source,0/* State.Inactive */):a);for(let effect of tr.effects)if(effect.is(setSelectedEffect))open=open&&open.setSelected(effect.value,this.id);return active==this.active&&open==this.open?this:new CompletionState(active,this.id,open);}get tooltip(){return this.open?this.open.tooltip:null;}get attrs(){return this.open?this.open.attrs:baseAttrs;}}function sameResults(a,b){if(a==b)return true;for(let iA=0,iB=0;;){while(iA<a.length&&!a[iA].hasResult)iA++;while(iB<b.length&&!b[iB].hasResult)iB++;let endA=iA==a.length,endB=iB==b.length;if(endA||endB)return endA==endB;if(a[iA++].result!=b[iB++].result)return false;}}const baseAttrs={"aria-autocomplete":"list"};function makeAttrs(id,selected){let result={"aria-autocomplete":"list","aria-haspopup":"listbox","aria-controls":id};if(selected>-1)result["aria-activedescendant"]=id+"-"+selected;return result;}const none=[];function getUserEvent(tr){return tr.isUserEvent("input.type")?"input":tr.isUserEvent("delete.backward")?"delete":null;}class ActiveSource{constructor(source,state,explicitPos=-1){this.source=source;this.state=state;this.explicitPos=explicitPos;}hasResult(){return false;}update(tr,conf){let event=getUserEvent(tr),value=this;if(event)value=value.handleUserEvent(tr,event,conf);else if(tr.docChanged)value=value.handleChange(tr);else if(tr.selection&&value.state!=0/* State.Inactive */)value=new ActiveSource(value.source,0/* State.Inactive */);for(let effect of tr.effects){if(effect.is(startCompletionEffect))value=new ActiveSource(value.source,1/* State.Pending */,effect.value?cur(tr.state):-1);else if(effect.is(closeCompletionEffect))value=new ActiveSource(value.source,0/* State.Inactive */);else if(effect.is(setActiveEffect))for(let active of effect.value)if(active.source==value.source)value=active;}return value;}handleUserEvent(tr,type,conf){return type=="delete"||!conf.activateOnTyping?this.map(tr.changes):new ActiveSource(this.source,1/* State.Pending */);}handleChange(tr){return tr.changes.touchesRange(cur(tr.startState))?new ActiveSource(this.source,0/* State.Inactive */):this.map(tr.changes);}map(changes){return changes.empty||this.explicitPos<0?this:new ActiveSource(this.source,this.state,changes.mapPos(this.explicitPos));}}class ActiveResult extends ActiveSource{constructor(source,explicitPos,result,from,to){super(source,2/* State.Result */,explicitPos);this.result=result;this.from=from;this.to=to;}hasResult(){return true;}handleUserEvent(tr,type,conf){var _a;let from=tr.changes.mapPos(this.from),to=tr.changes.mapPos(this.to,1);let pos=cur(tr.state);if((this.explicitPos<0?pos<=from:pos<this.from)||pos>to||type=="delete"&&cur(tr.startState)==this.from)return new ActiveSource(this.source,type=="input"&&conf.activateOnTyping?1/* State.Pending */:0/* State.Inactive */);let explicitPos=this.explicitPos<0?-1:tr.changes.mapPos(this.explicitPos),updated;if(checkValid(this.result.validFor,tr.state,from,to))return new ActiveResult(this.source,explicitPos,this.result,from,to);if(this.result.update&&(updated=this.result.update(this.result,from,to,new CompletionContext(tr.state,pos,explicitPos>=0))))return new ActiveResult(this.source,explicitPos,updated,updated.from,(_a=updated.to)!==null&&_a!==void 0?_a:cur(tr.state));return new ActiveSource(this.source,1/* State.Pending */,explicitPos);}handleChange(tr){return tr.changes.touchesRange(this.from,this.to)?new ActiveSource(this.source,0/* State.Inactive */):this.map(tr.changes);}map(mapping){return mapping.empty?this:new ActiveResult(this.source,this.explicitPos<0?-1:mapping.mapPos(this.explicitPos),this.result,mapping.mapPos(this.from),mapping.mapPos(this.to,1));}}function checkValid(validFor,state,from,to){if(!validFor)return false;let text=state.sliceDoc(from,to);return typeof validFor=="function"?validFor(text,from,to,state):ensureAnchor(validFor,true).test(text);}const setActiveEffect=/*@__PURE__*/StateEffect.define({map(sources,mapping){return sources.map(s=>s.map(mapping));}});const setSelectedEffect=/*@__PURE__*/StateEffect.define();const completionState=/*@__PURE__*/StateField.define({create(){return CompletionState.start();},update(value,tr){return value.update(tr);},provide:f=>[showTooltip.from(f,val=>val.tooltip),EditorView.contentAttributes.from(f,state=>state.attrs)]});function applyCompletion(view,option){const apply=option.completion.apply||option.completion.label;let result=view.state.field(completionState).active.find(a=>a.source==option.source);if(!(result instanceof ActiveResult))return false;if(typeof apply=="string")view.dispatch(Object.assign(Object.assign({},insertCompletionText(view.state,apply,result.from,result.to)),{annotations:pickedCompletion.of(option.completion)}));else apply(view,option.completion,result.from,result.to);return true;}const createTooltip=/*@__PURE__*/completionTooltip(completionState,applyCompletion);/**
  Returns a command that moves the completion selection forward or
  backward by the given amount.
  */function moveCompletionSelection(forward,by="option"){return view=>{let cState=view.state.field(completionState,false);if(!cState||!cState.open||cState.open.disabled||Date.now()-cState.open.timestamp<view.state.facet(completionConfig).interactionDelay)return false;let step=1,tooltip;if(by=="page"&&(tooltip=getTooltip(view,cState.open.tooltip)))step=Math.max(2,Math.floor(tooltip.dom.offsetHeight/tooltip.dom.querySelector("li").offsetHeight)-1);let{length}=cState.open.options;let selected=cState.open.selected>-1?cState.open.selected+step*(forward?1:-1):forward?0:length-1;if(selected<0)selected=by=="page"?0:length-1;else if(selected>=length)selected=by=="page"?length-1:0;view.dispatch({effects:setSelectedEffect.of(selected)});return true;};}/**
  Accept the current completion.
  */const acceptCompletion=view=>{let cState=view.state.field(completionState,false);if(view.state.readOnly||!cState||!cState.open||cState.open.selected<0||cState.open.disabled||Date.now()-cState.open.timestamp<view.state.facet(completionConfig).interactionDelay)return false;return applyCompletion(view,cState.open.options[cState.open.selected]);};/**
  Explicitly start autocompletion.
  */const startCompletion=view=>{let cState=view.state.field(completionState,false);if(!cState)return false;view.dispatch({effects:startCompletionEffect.of(true)});return true;};/**
  Close the currently active completion.
  */const closeCompletion=view=>{let cState=view.state.field(completionState,false);if(!cState||!cState.active.some(a=>a.state!=0/* State.Inactive */))return false;view.dispatch({effects:closeCompletionEffect.of(null)});return true;};class RunningQuery{constructor(active,context){this.active=active;this.context=context;this.time=Date.now();this.updates=[];// Note that 'undefined' means 'not done yet', whereas 'null' means
// 'query returned null'.
this.done=undefined;}}const MaxUpdateCount=50,MinAbortTime=1000;const completionPlugin=/*@__PURE__*/ViewPlugin.fromClass(class{constructor(view){this.view=view;this.debounceUpdate=-1;this.running=[];this.debounceAccept=-1;this.pendingStart=false;this.composing=0/* CompositionState.None */;for(let active of view.state.field(completionState).active)if(active.state==1/* State.Pending */)this.startQuery(active);}update(update){let cState=update.state.field(completionState);if(!update.selectionSet&&!update.docChanged&&update.startState.field(completionState)==cState)return;let doesReset=update.transactions.some(tr=>{return(tr.selection||tr.docChanged)&&!getUserEvent(tr);});for(let i=0;i<this.running.length;i++){let query=this.running[i];if(doesReset||query.updates.length+update.transactions.length>MaxUpdateCount&&Date.now()-query.time>MinAbortTime){for(let handler of query.context.abortListeners){try{handler();}catch(e){logException(this.view.state,e);}}query.context.abortListeners=null;this.running.splice(i--,1);}else{query.updates.push(...update.transactions);}}if(this.debounceUpdate>-1)clearTimeout(this.debounceUpdate);if(update.transactions.some(tr=>tr.effects.some(e=>e.is(startCompletionEffect))))this.pendingStart=true;let delay=this.pendingStart?50:update.state.facet(completionConfig).activateOnTypingDelay;this.debounceUpdate=cState.active.some(a=>a.state==1/* State.Pending */&&!this.running.some(q=>q.active.source==a.source))?setTimeout(()=>this.startUpdate(),delay):-1;if(this.composing!=0/* CompositionState.None */)for(let tr of update.transactions){if(getUserEvent(tr)=="input")this.composing=2/* CompositionState.Changed */;else if(this.composing==2/* CompositionState.Changed */&&tr.selection)this.composing=3/* CompositionState.ChangedAndMoved */;}}startUpdate(){this.debounceUpdate=-1;this.pendingStart=false;let{state}=this.view,cState=state.field(completionState);for(let active of cState.active){if(active.state==1/* State.Pending */&&!this.running.some(r=>r.active.source==active.source))this.startQuery(active);}}startQuery(active){let{state}=this.view,pos=cur(state);let context=new CompletionContext(state,pos,active.explicitPos==pos);let pending=new RunningQuery(active,context);this.running.push(pending);Promise.resolve(active.source(context)).then(result=>{if(!pending.context.aborted){pending.done=result||null;this.scheduleAccept();}},err=>{this.view.dispatch({effects:closeCompletionEffect.of(null)});logException(this.view.state,err);});}scheduleAccept(){if(this.running.every(q=>q.done!==undefined))this.accept();else if(this.debounceAccept<0)this.debounceAccept=setTimeout(()=>this.accept(),this.view.state.facet(completionConfig).updateSyncTime);}// For each finished query in this.running, try to create a result
// or, if appropriate, restart the query.
accept(){var _a;if(this.debounceAccept>-1)clearTimeout(this.debounceAccept);this.debounceAccept=-1;let updated=[];let conf=this.view.state.facet(completionConfig);for(let i=0;i<this.running.length;i++){let query=this.running[i];if(query.done===undefined)continue;this.running.splice(i--,1);if(query.done){let active=new ActiveResult(query.active.source,query.active.explicitPos,query.done,query.done.from,(_a=query.done.to)!==null&&_a!==void 0?_a:cur(query.updates.length?query.updates[0].startState:this.view.state));// Replay the transactions that happened since the start of
// the request and see if that preserves the result
for(let tr of query.updates)active=active.update(tr,conf);if(active.hasResult()){updated.push(active);continue;}}let current=this.view.state.field(completionState).active.find(a=>a.source==query.active.source);if(current&&current.state==1/* State.Pending */){if(query.done==null){// Explicitly failed. Should clear the pending status if it
// hasn't been re-set in the meantime.
let active=new ActiveSource(query.active.source,0/* State.Inactive */);for(let tr of query.updates)active=active.update(tr,conf);if(active.state!=1/* State.Pending */)updated.push(active);}else{// Cleared by subsequent transactions. Restart.
this.startQuery(current);}}}if(updated.length)this.view.dispatch({effects:setActiveEffect.of(updated)});}},{eventHandlers:{blur(event){let state=this.view.state.field(completionState,false);if(state&&state.tooltip&&this.view.state.facet(completionConfig).closeOnBlur){let dialog=state.open&&getTooltip(this.view,state.open.tooltip);if(!dialog||!dialog.dom.contains(event.relatedTarget))setTimeout(()=>this.view.dispatch({effects:closeCompletionEffect.of(null)}),10);}},compositionstart(){this.composing=1/* CompositionState.Started */;},compositionend(){if(this.composing==3/* CompositionState.ChangedAndMoved */){// Safari fires compositionend events synchronously, possibly
// from inside an update, so dispatch asynchronously to avoid reentrancy
setTimeout(()=>this.view.dispatch({effects:startCompletionEffect.of(false)}),20);}this.composing=0/* CompositionState.None */;}}});const windows=typeof navigator=="object"&&/*@__PURE__*/ /Win/.test(navigator.platform);const commitCharacters=/*@__PURE__*/Prec.highest(/*@__PURE__*/EditorView.domEventHandlers({keydown(event,view){let field=view.state.field(completionState,false);if(!field||!field.open||field.open.disabled||field.open.selected<0||event.key.length>1||event.ctrlKey&&!(windows&&event.altKey)||event.metaKey)return false;let option=field.open.options[field.open.selected];let result=field.active.find(a=>a.source==option.source);let commitChars=option.completion.commitCharacters||result.result.commitCharacters;if(commitChars&&commitChars.indexOf(event.key)>-1)applyCompletion(view,option);return false;}}));const baseTheme$1=/*@__PURE__*/EditorView.baseTheme({".cm-tooltip.cm-tooltip-autocomplete":{"& > ul":{fontFamily:"monospace",whiteSpace:"nowrap",overflow:"hidden auto",maxWidth_fallback:"700px",maxWidth:"min(700px, 95vw)",minWidth:"250px",maxHeight:"10em",height:"100%",listStyle:"none",margin:0,padding:0,"& > li, & > completion-section":{padding:"1px 3px",lineHeight:1.2},"& > li":{overflowX:"hidden",textOverflow:"ellipsis",cursor:"pointer"},"& > completion-section":{display:"list-item",borderBottom:"1px solid silver",paddingLeft:"0.5em",opacity:0.7}}},"&light .cm-tooltip-autocomplete ul li[aria-selected]":{background:"#17c",color:"white"},"&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]":{background:"#777"},"&dark .cm-tooltip-autocomplete ul li[aria-selected]":{background:"#347",color:"white"},"&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]":{background:"#444"},".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after":{content:'"···"',opacity:0.5,display:"block",textAlign:"center"},".cm-tooltip.cm-completionInfo":{position:"absolute",padding:"3px 9px",width:"max-content",maxWidth:`${400/* Info.Width */}px`,boxSizing:"border-box"},".cm-completionInfo.cm-completionInfo-left":{right:"100%"},".cm-completionInfo.cm-completionInfo-right":{left:"100%"},".cm-completionInfo.cm-completionInfo-left-narrow":{right:`${30/* Info.Margin */}px`},".cm-completionInfo.cm-completionInfo-right-narrow":{left:`${30/* Info.Margin */}px`},"&light .cm-snippetField":{backgroundColor:"#00000022"},"&dark .cm-snippetField":{backgroundColor:"#ffffff22"},".cm-snippetFieldPosition":{verticalAlign:"text-top",width:0,height:"1.15em",display:"inline-block",margin:"0 -0.7px -.7em",borderLeft:"1.4px dotted #888"},".cm-completionMatchedText":{textDecoration:"underline"},".cm-completionDetail":{marginLeft:"0.5em",fontStyle:"italic"},".cm-completionIcon":{fontSize:"90%",width:".8em",display:"inline-block",textAlign:"center",paddingRight:".6em",opacity:"0.6",boxSizing:"content-box"},".cm-completionIcon-function, .cm-completionIcon-method":{"&:after":{content:"'ƒ'"}},".cm-completionIcon-class":{"&:after":{content:"'○'"}},".cm-completionIcon-interface":{"&:after":{content:"'◌'"}},".cm-completionIcon-variable":{"&:after":{content:"'𝑥'"}},".cm-completionIcon-constant":{"&:after":{content:"'𝐶'"}},".cm-completionIcon-type":{"&:after":{content:"'𝑡'"}},".cm-completionIcon-enum":{"&:after":{content:"'∪'"}},".cm-completionIcon-property":{"&:after":{content:"'□'"}},".cm-completionIcon-keyword":{"&:after":{content:"'🔑\uFE0E'"}// Disable emoji rendering
},".cm-completionIcon-namespace":{"&:after":{content:"'▢'"}},".cm-completionIcon-text":{"&:after":{content:"'abc'",fontSize:"50%",verticalAlign:"middle"}}});class FieldPos{constructor(field,line,from,to){this.field=field;this.line=line;this.from=from;this.to=to;}}class FieldRange{constructor(field,from,to){this.field=field;this.from=from;this.to=to;}map(changes){let from=changes.mapPos(this.from,-1,MapMode.TrackDel);let to=changes.mapPos(this.to,1,MapMode.TrackDel);return from==null||to==null?null:new FieldRange(this.field,from,to);}}class Snippet{constructor(lines,fieldPositions){this.lines=lines;this.fieldPositions=fieldPositions;}instantiate(state,pos){let text=[],lineStart=[pos];let lineObj=state.doc.lineAt(pos),baseIndent=/^\s*/.exec(lineObj.text)[0];for(let line of this.lines){if(text.length){let indent=baseIndent,tabs=/^\t*/.exec(line)[0].length;for(let i=0;i<tabs;i++)indent+=state.facet(indentUnit);lineStart.push(pos+indent.length-tabs);line=indent+line.slice(tabs);}text.push(line);pos+=line.length+1;}let ranges=this.fieldPositions.map(pos=>new FieldRange(pos.field,lineStart[pos.line]+pos.from,lineStart[pos.line]+pos.to));return{text,ranges};}static parse(template){let fields=[];let lines=[],positions=[],m;for(let line of template.split(/\r\n?|\n/)){while(m=/[#$]\{(?:(\d+)(?::([^}]*))?|([^}]*))\}/.exec(line)){let seq=m[1]?+m[1]:null,name=m[2]||m[3]||"",found=-1;for(let i=0;i<fields.length;i++){if(seq!=null?fields[i].seq==seq:name?fields[i].name==name:false)found=i;}if(found<0){let i=0;while(i<fields.length&&(seq==null||fields[i].seq!=null&&fields[i].seq<seq))i++;fields.splice(i,0,{seq,name});found=i;for(let pos of positions)if(pos.field>=found)pos.field++;}positions.push(new FieldPos(found,lines.length,m.index,m.index+name.length));line=line.slice(0,m.index)+name+line.slice(m.index+m[0].length);}for(let esc;esc=/\\([{}])/.exec(line);){line=line.slice(0,esc.index)+esc[1]+line.slice(esc.index+esc[0].length);for(let pos of positions)if(pos.line==lines.length&&pos.from>esc.index){pos.from--;pos.to--;}}lines.push(line);}return new Snippet(lines,positions);}}let fieldMarker=/*@__PURE__*/Decoration.widget({widget:/*@__PURE__*/new class extends WidgetType{toDOM(){let span=document.createElement("span");span.className="cm-snippetFieldPosition";return span;}ignoreEvent(){return false;}}()});let fieldRange=/*@__PURE__*/Decoration.mark({class:"cm-snippetField"});class ActiveSnippet{constructor(ranges,active){this.ranges=ranges;this.active=active;this.deco=Decoration.set(ranges.map(r=>(r.from==r.to?fieldMarker:fieldRange).range(r.from,r.to)));}map(changes){let ranges=[];for(let r of this.ranges){let mapped=r.map(changes);if(!mapped)return null;ranges.push(mapped);}return new ActiveSnippet(ranges,this.active);}selectionInsideField(sel){return sel.ranges.every(range=>this.ranges.some(r=>r.field==this.active&&r.from<=range.from&&r.to>=range.to));}}const setActive=/*@__PURE__*/StateEffect.define({map(value,changes){return value&&value.map(changes);}});const moveToField=/*@__PURE__*/StateEffect.define();const snippetState=/*@__PURE__*/StateField.define({create(){return null;},update(value,tr){for(let effect of tr.effects){if(effect.is(setActive))return effect.value;if(effect.is(moveToField)&&value)return new ActiveSnippet(value.ranges,effect.value);}if(value&&tr.docChanged)value=value.map(tr.changes);if(value&&tr.selection&&!value.selectionInsideField(tr.selection))value=null;return value;},provide:f=>EditorView.decorations.from(f,val=>val?val.deco:Decoration.none)});function fieldSelection(ranges,field){return EditorSelection.create(ranges.filter(r=>r.field==field).map(r=>EditorSelection.range(r.from,r.to)));}/**
  Convert a snippet template to a function that can
  [apply](https://codemirror.net/6/docs/ref/#autocomplete.Completion.apply) it. Snippets are written
  using syntax like this:

      "for (let ${index} = 0; ${index} < ${end}; ${index}++) {\n\t${}\n}"

  Each `${}` placeholder (you may also use `#{}`) indicates a field
  that the user can fill in. Its name, if any, will be the default
  content for the field.

  When the snippet is activated by calling the returned function,
  the code is inserted at the given position. Newlines in the
  template are indented by the indentation of the start line, plus
  one [indent unit](https://codemirror.net/6/docs/ref/#language.indentUnit) per tab character after
  the newline.

  On activation, (all instances of) the first field are selected.
  The user can move between fields with Tab and Shift-Tab as long as
  the fields are active. Moving to the last field or moving the
  cursor out of the current field deactivates the fields.

  The order of fields defaults to textual order, but you can add
  numbers to placeholders (`${1}` or `${1:defaultText}`) to provide
  a custom order.

  To include a literal `{` or `}` in your template, put a backslash
  in front of it. This will be removed and the brace will not be
  interpreted as indicating a placeholder.
  */function snippet(template){let snippet=Snippet.parse(template);return(editor,completion,from,to)=>{let{text,ranges}=snippet.instantiate(editor.state,from);let spec={changes:{from,to,insert:Text.of(text)},scrollIntoView:true,annotations:completion?[pickedCompletion.of(completion),Transaction.userEvent.of("input.complete")]:undefined};if(ranges.length)spec.selection=fieldSelection(ranges,0);if(ranges.some(r=>r.field>0)){let active=new ActiveSnippet(ranges,0);let effects=spec.effects=[setActive.of(active)];if(editor.state.field(snippetState,false)===undefined)effects.push(StateEffect.appendConfig.of([snippetState,addSnippetKeymap,snippetPointerHandler,baseTheme$1]));}editor.dispatch(editor.state.update(spec));};}function moveField(dir){return({state,dispatch})=>{let active=state.field(snippetState,false);if(!active||dir<0&&active.active==0)return false;let next=active.active+dir,last=dir>0&&!active.ranges.some(r=>r.field==next+dir);dispatch(state.update({selection:fieldSelection(active.ranges,next),effects:setActive.of(last?null:new ActiveSnippet(active.ranges,next)),scrollIntoView:true}));return true;};}/**
  A command that clears the active snippet, if any.
  */const clearSnippet=({state,dispatch})=>{let active=state.field(snippetState,false);if(!active)return false;dispatch(state.update({effects:setActive.of(null)}));return true;};/**
  Move to the next snippet field, if available.
  */const nextSnippetField=/*@__PURE__*/moveField(1);/**
  Move to the previous snippet field, if available.
  */const prevSnippetField=/*@__PURE__*/moveField(-1);const defaultSnippetKeymap=[{key:"Tab",run:nextSnippetField,shift:prevSnippetField},{key:"Escape",run:clearSnippet}];/**
  A facet that can be used to configure the key bindings used by
  snippets. The default binds Tab to
  [`nextSnippetField`](https://codemirror.net/6/docs/ref/#autocomplete.nextSnippetField), Shift-Tab to
  [`prevSnippetField`](https://codemirror.net/6/docs/ref/#autocomplete.prevSnippetField), and Escape
  to [`clearSnippet`](https://codemirror.net/6/docs/ref/#autocomplete.clearSnippet).
  */const snippetKeymap=/*@__PURE__*/Facet.define({combine(maps){return maps.length?maps[0]:defaultSnippetKeymap;}});const addSnippetKeymap=/*@__PURE__*/Prec.highest(/*@__PURE__*/keymap.compute([snippetKeymap],state=>state.facet(snippetKeymap)));/**
  Create a completion from a snippet. Returns an object with the
  properties from `completion`, plus an `apply` function that
  applies the snippet.
  */function snippetCompletion(template,completion){return Object.assign(Object.assign({},completion),{apply:snippet(template)});}const snippetPointerHandler=/*@__PURE__*/EditorView.domEventHandlers({mousedown(event,view){let active=view.state.field(snippetState,false),pos;if(!active||(pos=view.posAtCoords({x:event.clientX,y:event.clientY}))==null)return false;let match=active.ranges.find(r=>r.from<=pos&&r.to>=pos);if(!match||match.field==active.active)return false;view.dispatch({selection:fieldSelection(active.ranges,match.field),effects:setActive.of(active.ranges.some(r=>r.field>match.field)?new ActiveSnippet(active.ranges,match.field):null),scrollIntoView:true});return true;}});const defaults={brackets:["(","[","{","'",'"'],before:")]}:;>",stringPrefixes:[]};const closeBracketEffect=/*@__PURE__*/StateEffect.define({map(value,mapping){let mapped=mapping.mapPos(value,-1,MapMode.TrackAfter);return mapped==null?undefined:mapped;}});const closedBracket=/*@__PURE__*/new class extends RangeValue{}();closedBracket.startSide=1;closedBracket.endSide=-1;const bracketState=/*@__PURE__*/StateField.define({create(){return RangeSet.empty;},update(value,tr){value=value.map(tr.changes);if(tr.selection){let line=tr.state.doc.lineAt(tr.selection.main.head);value=value.update({filter:from=>from>=line.from&&from<=line.to});}for(let effect of tr.effects)if(effect.is(closeBracketEffect))value=value.update({add:[closedBracket.range(effect.value,effect.value+1)]});return value;}});/**
  Extension to enable bracket-closing behavior. When a closeable
  bracket is typed, its closing bracket is immediately inserted
  after the cursor. When closing a bracket directly in front of a
  closing bracket inserted by the extension, the cursor moves over
  that bracket.
  */function closeBrackets(){return[inputHandler,bracketState];}const definedClosing="()[]{}<>";function closing(ch){for(let i=0;i<definedClosing.length;i+=2)if(definedClosing.charCodeAt(i)==ch)return definedClosing.charAt(i+1);return fromCodePoint(ch<128?ch:ch+1);}function config$1(state,pos){return state.languageDataAt("closeBrackets",pos)[0]||defaults;}const android$1=typeof navigator=="object"&&/*@__PURE__*/ /Android\b/.test(navigator.userAgent);const inputHandler=/*@__PURE__*/EditorView.inputHandler.of((view,from,to,insert)=>{if((android$1?view.composing:view.compositionStarted)||view.state.readOnly)return false;let sel=view.state.selection.main;if(insert.length>2||insert.length==2&&codePointSize(codePointAt(insert,0))==1||from!=sel.from||to!=sel.to)return false;let tr=insertBracket(view.state,insert);if(!tr)return false;view.dispatch(tr);return true;});/**
  Command that implements deleting a pair of matching brackets when
  the cursor is between them.
  */const deleteBracketPair=({state,dispatch})=>{if(state.readOnly)return false;let conf=config$1(state,state.selection.main.head);let tokens=conf.brackets||defaults.brackets;let dont=null,changes=state.changeByRange(range=>{if(range.empty){let before=prevChar(state.doc,range.head);for(let token of tokens){if(token==before&&nextChar(state.doc,range.head)==closing(codePointAt(token,0)))return{changes:{from:range.head-token.length,to:range.head+token.length},range:EditorSelection.cursor(range.head-token.length)};}}return{range:dont=range};});if(!dont)dispatch(state.update(changes,{scrollIntoView:true,userEvent:"delete.backward"}));return!dont;};/**
  Close-brackets related key bindings. Binds Backspace to
  [`deleteBracketPair`](https://codemirror.net/6/docs/ref/#autocomplete.deleteBracketPair).
  */const closeBracketsKeymap=[{key:"Backspace",run:deleteBracketPair}];/**
  Implements the extension's behavior on text insertion. If the
  given string counts as a bracket in the language around the
  selection, and replacing the selection with it requires custom
  behavior (inserting a closing version or skipping past a
  previously-closed bracket), this function returns a transaction
  representing that custom behavior. (You only need this if you want
  to programmatically insert brackets—the
  [`closeBrackets`](https://codemirror.net/6/docs/ref/#autocomplete.closeBrackets) extension will
  take care of running this for user input.)
  */function insertBracket(state,bracket){let conf=config$1(state,state.selection.main.head);let tokens=conf.brackets||defaults.brackets;for(let tok of tokens){let closed=closing(codePointAt(tok,0));if(bracket==tok)return closed==tok?handleSame(state,tok,tokens.indexOf(tok+tok+tok)>-1,conf):handleOpen(state,tok,closed,conf.before||defaults.before);if(bracket==closed&&closedBracketAt(state,state.selection.main.from))return handleClose(state,tok,closed);}return null;}function closedBracketAt(state,pos){let found=false;state.field(bracketState).between(0,state.doc.length,from=>{if(from==pos)found=true;});return found;}function nextChar(doc,pos){let next=doc.sliceString(pos,pos+2);return next.slice(0,codePointSize(codePointAt(next,0)));}function prevChar(doc,pos){let prev=doc.sliceString(pos-2,pos);return codePointSize(codePointAt(prev,0))==prev.length?prev:prev.slice(1);}function handleOpen(state,open,close,closeBefore){let dont=null,changes=state.changeByRange(range=>{if(!range.empty)return{changes:[{insert:open,from:range.from},{insert:close,from:range.to}],effects:closeBracketEffect.of(range.to+open.length),range:EditorSelection.range(range.anchor+open.length,range.head+open.length)};let next=nextChar(state.doc,range.head);if(!next||/\s/.test(next)||closeBefore.indexOf(next)>-1)return{changes:{insert:open+close,from:range.head},effects:closeBracketEffect.of(range.head+open.length),range:EditorSelection.cursor(range.head+open.length)};return{range:dont=range};});return dont?null:state.update(changes,{scrollIntoView:true,userEvent:"input.type"});}function handleClose(state,_open,close){let dont=null,changes=state.changeByRange(range=>{if(range.empty&&nextChar(state.doc,range.head)==close)return{changes:{from:range.head,to:range.head+close.length,insert:close},range:EditorSelection.cursor(range.head+close.length)};return dont={range};});return dont?null:state.update(changes,{scrollIntoView:true,userEvent:"input.type"});}// Handles cases where the open and close token are the same, and
// possibly triple quotes (as in `"""abc"""`-style quoting).
function handleSame(state,token,allowTriple,config){let stringPrefixes=config.stringPrefixes||defaults.stringPrefixes;let dont=null,changes=state.changeByRange(range=>{if(!range.empty)return{changes:[{insert:token,from:range.from},{insert:token,from:range.to}],effects:closeBracketEffect.of(range.to+token.length),range:EditorSelection.range(range.anchor+token.length,range.head+token.length)};let pos=range.head,next=nextChar(state.doc,pos),start;if(next==token){if(nodeStart(state,pos)){return{changes:{insert:token+token,from:pos},effects:closeBracketEffect.of(pos+token.length),range:EditorSelection.cursor(pos+token.length)};}else if(closedBracketAt(state,pos)){let isTriple=allowTriple&&state.sliceDoc(pos,pos+token.length*3)==token+token+token;let content=isTriple?token+token+token:token;return{changes:{from:pos,to:pos+content.length,insert:content},range:EditorSelection.cursor(pos+content.length)};}}else if(allowTriple&&state.sliceDoc(pos-2*token.length,pos)==token+token&&(start=canStartStringAt(state,pos-2*token.length,stringPrefixes))>-1&&nodeStart(state,start)){return{changes:{insert:token+token+token+token,from:pos},effects:closeBracketEffect.of(pos+token.length),range:EditorSelection.cursor(pos+token.length)};}else if(state.charCategorizer(pos)(next)!=CharCategory.Word){if(canStartStringAt(state,pos,stringPrefixes)>-1&&!probablyInString(state,pos,token,stringPrefixes))return{changes:{insert:token+token,from:pos},effects:closeBracketEffect.of(pos+token.length),range:EditorSelection.cursor(pos+token.length)};}return{range:dont=range};});return dont?null:state.update(changes,{scrollIntoView:true,userEvent:"input.type"});}function nodeStart(state,pos){let tree=syntaxTree(state).resolveInner(pos+1);return tree.parent&&tree.from==pos;}function probablyInString(state,pos,quoteToken,prefixes){let node=syntaxTree(state).resolveInner(pos,-1);let maxPrefix=prefixes.reduce((m,p)=>Math.max(m,p.length),0);for(let i=0;i<5;i++){let start=state.sliceDoc(node.from,Math.min(node.to,node.from+quoteToken.length+maxPrefix));let quotePos=start.indexOf(quoteToken);if(!quotePos||quotePos>-1&&prefixes.indexOf(start.slice(0,quotePos))>-1){let first=node.firstChild;while(first&&first.from==node.from&&first.to-first.from>quoteToken.length+quotePos){if(state.sliceDoc(first.to-quoteToken.length,first.to)==quoteToken)return false;first=first.firstChild;}return true;}let parent=node.to==pos&&node.parent;if(!parent)break;node=parent;}return false;}function canStartStringAt(state,pos,prefixes){let charCat=state.charCategorizer(pos);if(charCat(state.sliceDoc(pos-1,pos))!=CharCategory.Word)return pos;for(let prefix of prefixes){let start=pos-prefix.length;if(state.sliceDoc(start,pos)==prefix&&charCat(state.sliceDoc(start-1,start))!=CharCategory.Word)return start;}return-1;}/**
  Returns an extension that enables autocompletion.
  */function autocompletion(config={}){return[commitCharacters,completionState,completionConfig.of(config),completionPlugin,completionKeymapExt,baseTheme$1];}/**
  Basic keybindings for autocompletion.

   - Ctrl-Space: [`startCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.startCompletion)
   - Escape: [`closeCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.closeCompletion)
   - ArrowDown: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(true)`
   - ArrowUp: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(false)`
   - PageDown: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(true, "page")`
   - PageDown: [`moveCompletionSelection`](https://codemirror.net/6/docs/ref/#autocomplete.moveCompletionSelection)`(true, "page")`
   - Enter: [`acceptCompletion`](https://codemirror.net/6/docs/ref/#autocomplete.acceptCompletion)
  */const completionKeymap=[{key:"Ctrl-Space",run:startCompletion},{key:"Escape",run:closeCompletion},{key:"ArrowDown",run:/*@__PURE__*/moveCompletionSelection(true)},{key:"ArrowUp",run:/*@__PURE__*/moveCompletionSelection(false)},{key:"PageDown",run:/*@__PURE__*/moveCompletionSelection(true,"page")},{key:"PageUp",run:/*@__PURE__*/moveCompletionSelection(false,"page")},{key:"Enter",run:acceptCompletion}];const completionKeymapExt=/*@__PURE__*/Prec.highest(/*@__PURE__*/keymap.computeN([completionConfig],state=>state.facet(completionConfig).defaultKeymap?[completionKeymap]:[]));class SelectedDiagnostic{constructor(from,to,diagnostic){this.from=from;this.to=to;this.diagnostic=diagnostic;}}class LintState{constructor(diagnostics,panel,selected){this.diagnostics=diagnostics;this.panel=panel;this.selected=selected;}static init(diagnostics,panel,state){// Filter the list of diagnostics for which to create markers
let markedDiagnostics=diagnostics;let diagnosticFilter=state.facet(lintConfig).markerFilter;if(diagnosticFilter)markedDiagnostics=diagnosticFilter(markedDiagnostics,state);let ranges=Decoration.set(markedDiagnostics.map(d=>{// For zero-length ranges or ranges covering only a line break, create a widget
return d.from==d.to||d.from==d.to-1&&state.doc.lineAt(d.from).to==d.from?Decoration.widget({widget:new DiagnosticWidget(d),diagnostic:d}).range(d.from):Decoration.mark({attributes:{class:"cm-lintRange cm-lintRange-"+d.severity+(d.markClass?" "+d.markClass:"")},diagnostic:d,inclusive:true}).range(d.from,d.to);}),true);return new LintState(ranges,panel,findDiagnostic(ranges));}}function findDiagnostic(diagnostics,diagnostic=null,after=0){let found=null;diagnostics.between(after,1e9,(from,to,{spec})=>{if(diagnostic&&spec.diagnostic!=diagnostic)return;found=new SelectedDiagnostic(from,to,spec.diagnostic);return false;});return found;}function hideTooltip(tr,tooltip){let line=tr.startState.doc.lineAt(tooltip.pos);return!!(tr.effects.some(e=>e.is(setDiagnosticsEffect))||tr.changes.touchesRange(line.from,line.to));}function maybeEnableLint(state,effects){return state.field(lintState,false)?effects:effects.concat(StateEffect.appendConfig.of(lintExtensions));}/**
  The state effect that updates the set of active diagnostics. Can
  be useful when writing an extension that needs to track these.
  */const setDiagnosticsEffect=/*@__PURE__*/StateEffect.define();const togglePanel=/*@__PURE__*/StateEffect.define();const movePanelSelection=/*@__PURE__*/StateEffect.define();const lintState=/*@__PURE__*/StateField.define({create(){return new LintState(Decoration.none,null,null);},update(value,tr){if(tr.docChanged){let mapped=value.diagnostics.map(tr.changes),selected=null;if(value.selected){let selPos=tr.changes.mapPos(value.selected.from,1);selected=findDiagnostic(mapped,value.selected.diagnostic,selPos)||findDiagnostic(mapped,null,selPos);}value=new LintState(mapped,value.panel,selected);}for(let effect of tr.effects){if(effect.is(setDiagnosticsEffect)){value=LintState.init(effect.value,value.panel,tr.state);}else if(effect.is(togglePanel)){value=new LintState(value.diagnostics,effect.value?LintPanel.open:null,value.selected);}else if(effect.is(movePanelSelection)){value=new LintState(value.diagnostics,value.panel,effect.value);}}return value;},provide:f=>[showPanel.from(f,val=>val.panel),EditorView.decorations.from(f,s=>s.diagnostics)]});const activeMark=/*@__PURE__*/Decoration.mark({class:"cm-lintRange cm-lintRange-active",inclusive:true});function lintTooltip(view,pos,side){let{diagnostics}=view.state.field(lintState);let found=[],stackStart=2e8,stackEnd=0;diagnostics.between(pos-(side<0?1:0),pos+(side>0?1:0),(from,to,{spec})=>{if(pos>=from&&pos<=to&&(from==to||(pos>from||side>0)&&(pos<to||side<0))){found.push(spec.diagnostic);stackStart=Math.min(from,stackStart);stackEnd=Math.max(to,stackEnd);}});let diagnosticFilter=view.state.facet(lintConfig).tooltipFilter;if(diagnosticFilter)found=diagnosticFilter(found,view.state);if(!found.length)return null;return{pos:stackStart,end:stackEnd,above:view.state.doc.lineAt(stackStart).to<stackEnd,create(){return{dom:diagnosticsTooltip(view,found)};}};}function diagnosticsTooltip(view,diagnostics){return crelt("ul",{class:"cm-tooltip-lint"},diagnostics.map(d=>renderDiagnostic(view,d,false)));}/**
  Command to open and focus the lint panel.
  */const openLintPanel=view=>{let field=view.state.field(lintState,false);if(!field||!field.panel)view.dispatch({effects:maybeEnableLint(view.state,[togglePanel.of(true)])});let panel=getPanel(view,LintPanel.open);if(panel)panel.dom.querySelector(".cm-panel-lint ul").focus();return true;};/**
  Command to close the lint panel, when open.
  */const closeLintPanel=view=>{let field=view.state.field(lintState,false);if(!field||!field.panel)return false;view.dispatch({effects:togglePanel.of(false)});return true;};/**
  Move the selection to the next diagnostic.
  */const nextDiagnostic=view=>{let field=view.state.field(lintState,false);if(!field)return false;let sel=view.state.selection.main,next=field.diagnostics.iter(sel.to+1);if(!next.value){next=field.diagnostics.iter(0);if(!next.value||next.from==sel.from&&next.to==sel.to)return false;}view.dispatch({selection:{anchor:next.from,head:next.to},scrollIntoView:true});return true;};/**
  A set of default key bindings for the lint functionality.

  - Ctrl-Shift-m (Cmd-Shift-m on macOS): [`openLintPanel`](https://codemirror.net/6/docs/ref/#lint.openLintPanel)
  - F8: [`nextDiagnostic`](https://codemirror.net/6/docs/ref/#lint.nextDiagnostic)
  */const lintKeymap=[{key:"Mod-Shift-m",run:openLintPanel,preventDefault:true},{key:"F8",run:nextDiagnostic}];const lintConfig=/*@__PURE__*/Facet.define({combine(input){return Object.assign({sources:input.map(i=>i.source).filter(x=>x!=null)},combineConfig(input.map(i=>i.config),{delay:750,markerFilter:null,tooltipFilter:null,needsRefresh:null},{needsRefresh:(a,b)=>!a?b:!b?a:u=>a(u)||b(u)}));}});function assignKeys(actions){let assigned=[];if(actions)actions:for(let{name}of actions){for(let i=0;i<name.length;i++){let ch=name[i];if(/[a-zA-Z]/.test(ch)&&!assigned.some(c=>c.toLowerCase()==ch.toLowerCase())){assigned.push(ch);continue actions;}}assigned.push("");}return assigned;}function renderDiagnostic(view,diagnostic,inPanel){var _a;let keys=inPanel?assignKeys(diagnostic.actions):[];return crelt("li",{class:"cm-diagnostic cm-diagnostic-"+diagnostic.severity},crelt("span",{class:"cm-diagnosticText"},diagnostic.renderMessage?diagnostic.renderMessage():diagnostic.message),(_a=diagnostic.actions)===null||_a===void 0?void 0:_a.map((action,i)=>{let fired=false,click=e=>{e.preventDefault();if(fired)return;fired=true;let found=findDiagnostic(view.state.field(lintState).diagnostics,diagnostic);if(found)action.apply(view,found.from,found.to);};let{name}=action,keyIndex=keys[i]?name.indexOf(keys[i]):-1;let nameElt=keyIndex<0?name:[name.slice(0,keyIndex),crelt("u",name.slice(keyIndex,keyIndex+1)),name.slice(keyIndex+1)];return crelt("button",{type:"button",class:"cm-diagnosticAction",onclick:click,onmousedown:click,"aria-label":` Action: ${name}${keyIndex<0?"":` (access key "${keys[i]})"`}.`},nameElt);}),diagnostic.source&&crelt("div",{class:"cm-diagnosticSource"},diagnostic.source));}class DiagnosticWidget extends WidgetType{constructor(diagnostic){super();this.diagnostic=diagnostic;}eq(other){return other.diagnostic==this.diagnostic;}toDOM(){return crelt("span",{class:"cm-lintPoint cm-lintPoint-"+this.diagnostic.severity});}}class PanelItem{constructor(view,diagnostic){this.diagnostic=diagnostic;this.id="item_"+Math.floor(Math.random()*0xffffffff).toString(16);this.dom=renderDiagnostic(view,diagnostic,true);this.dom.id=this.id;this.dom.setAttribute("role","option");}}class LintPanel{constructor(view){this.view=view;this.items=[];let onkeydown=event=>{if(event.keyCode==27){// Escape
closeLintPanel(this.view);this.view.focus();}else if(event.keyCode==38||event.keyCode==33){// ArrowUp, PageUp
this.moveSelection((this.selectedIndex-1+this.items.length)%this.items.length);}else if(event.keyCode==40||event.keyCode==34){// ArrowDown, PageDown
this.moveSelection((this.selectedIndex+1)%this.items.length);}else if(event.keyCode==36){// Home
this.moveSelection(0);}else if(event.keyCode==35){// End
this.moveSelection(this.items.length-1);}else if(event.keyCode==13){// Enter
this.view.focus();}else if(event.keyCode>=65&&event.keyCode<=90&&this.selectedIndex>=0){// A-Z
let{diagnostic}=this.items[this.selectedIndex],keys=assignKeys(diagnostic.actions);for(let i=0;i<keys.length;i++)if(keys[i].toUpperCase().charCodeAt(0)==event.keyCode){let found=findDiagnostic(this.view.state.field(lintState).diagnostics,diagnostic);if(found)diagnostic.actions[i].apply(view,found.from,found.to);}}else{return;}event.preventDefault();};let onclick=event=>{for(let i=0;i<this.items.length;i++){if(this.items[i].dom.contains(event.target))this.moveSelection(i);}};this.list=crelt("ul",{tabIndex:0,role:"listbox","aria-label":this.view.state.phrase("Diagnostics"),onkeydown,onclick});this.dom=crelt("div",{class:"cm-panel-lint"},this.list,crelt("button",{type:"button",name:"close","aria-label":this.view.state.phrase("close"),onclick:()=>closeLintPanel(this.view)},"×"));this.update();}get selectedIndex(){let selected=this.view.state.field(lintState).selected;if(!selected)return-1;for(let i=0;i<this.items.length;i++)if(this.items[i].diagnostic==selected.diagnostic)return i;return-1;}update(){let{diagnostics,selected}=this.view.state.field(lintState);let i=0,needsSync=false,newSelectedItem=null;diagnostics.between(0,this.view.state.doc.length,(_start,_end,{spec})=>{let found=-1,item;for(let j=i;j<this.items.length;j++)if(this.items[j].diagnostic==spec.diagnostic){found=j;break;}if(found<0){item=new PanelItem(this.view,spec.diagnostic);this.items.splice(i,0,item);needsSync=true;}else{item=this.items[found];if(found>i){this.items.splice(i,found-i);needsSync=true;}}if(selected&&item.diagnostic==selected.diagnostic){if(!item.dom.hasAttribute("aria-selected")){item.dom.setAttribute("aria-selected","true");newSelectedItem=item;}}else if(item.dom.hasAttribute("aria-selected")){item.dom.removeAttribute("aria-selected");}i++;});while(i<this.items.length&&!(this.items.length==1&&this.items[0].diagnostic.from<0)){needsSync=true;this.items.pop();}if(this.items.length==0){this.items.push(new PanelItem(this.view,{from:-1,to:-1,severity:"info",message:this.view.state.phrase("No diagnostics")}));needsSync=true;}if(newSelectedItem){this.list.setAttribute("aria-activedescendant",newSelectedItem.id);this.view.requestMeasure({key:this,read:()=>({sel:newSelectedItem.dom.getBoundingClientRect(),panel:this.list.getBoundingClientRect()}),write:({sel,panel})=>{let scaleY=panel.height/this.list.offsetHeight;if(sel.top<panel.top)this.list.scrollTop-=(panel.top-sel.top)/scaleY;else if(sel.bottom>panel.bottom)this.list.scrollTop+=(sel.bottom-panel.bottom)/scaleY;}});}else if(this.selectedIndex<0){this.list.removeAttribute("aria-activedescendant");}if(needsSync)this.sync();}sync(){let domPos=this.list.firstChild;function rm(){let prev=domPos;domPos=prev.nextSibling;prev.remove();}for(let item of this.items){if(item.dom.parentNode==this.list){while(domPos!=item.dom)rm();domPos=item.dom.nextSibling;}else{this.list.insertBefore(item.dom,domPos);}}while(domPos)rm();}moveSelection(selectedIndex){if(this.selectedIndex<0)return;let field=this.view.state.field(lintState);let selection=findDiagnostic(field.diagnostics,this.items[selectedIndex].diagnostic);if(!selection)return;this.view.dispatch({selection:{anchor:selection.from,head:selection.to},scrollIntoView:true,effects:movePanelSelection.of(selection)});}static open(view){return new LintPanel(view);}}function svg(content,attrs=`viewBox="0 0 40 40"`){return`url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${encodeURIComponent(content)}</svg>')`;}function underline(color){return svg(`<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${color}" fill="none" stroke-width=".7"/>`,`width="6" height="3"`);}const baseTheme=/*@__PURE__*/EditorView.baseTheme({".cm-diagnostic":{padding:"3px 6px 3px 8px",marginLeft:"-1px",display:"block",whiteSpace:"pre-wrap"},".cm-diagnostic-error":{borderLeft:"5px solid #d11"},".cm-diagnostic-warning":{borderLeft:"5px solid orange"},".cm-diagnostic-info":{borderLeft:"5px solid #999"},".cm-diagnostic-hint":{borderLeft:"5px solid #66d"},".cm-diagnosticAction":{font:"inherit",border:"none",padding:"2px 4px",backgroundColor:"#444",color:"white",borderRadius:"3px",marginLeft:"8px",cursor:"pointer"},".cm-diagnosticSource":{fontSize:"70%",opacity:.7},".cm-lintRange":{backgroundPosition:"left bottom",backgroundRepeat:"repeat-x",paddingBottom:"0.7px"},".cm-lintRange-error":{backgroundImage:/*@__PURE__*/underline("#d11")},".cm-lintRange-warning":{backgroundImage:/*@__PURE__*/underline("orange")},".cm-lintRange-info":{backgroundImage:/*@__PURE__*/underline("#999")},".cm-lintRange-hint":{backgroundImage:/*@__PURE__*/underline("#66d")},".cm-lintRange-active":{backgroundColor:"#ffdd9980"},".cm-tooltip-lint":{padding:0,margin:0},".cm-lintPoint":{position:"relative","&:after":{content:'""',position:"absolute",bottom:0,left:"-2px",borderLeft:"3px solid transparent",borderRight:"3px solid transparent",borderBottom:"4px solid #d11"}},".cm-lintPoint-warning":{"&:after":{borderBottomColor:"orange"}},".cm-lintPoint-info":{"&:after":{borderBottomColor:"#999"}},".cm-lintPoint-hint":{"&:after":{borderBottomColor:"#66d"}},".cm-panel.cm-panel-lint":{position:"relative","& ul":{maxHeight:"100px",overflowY:"auto","& [aria-selected]":{backgroundColor:"#ddd","& u":{textDecoration:"underline"}},"&:focus [aria-selected]":{background_fallback:"#bdf",backgroundColor:"Highlight",color_fallback:"white",color:"HighlightText"},"& u":{textDecoration:"none"},padding:0,margin:0},"& [name=close]":{position:"absolute",top:"0",right:"2px",background:"inherit",border:"none",font:"inherit",padding:0,margin:0}}});const lintExtensions=[lintState,/*@__PURE__*/EditorView.decorations.compute([lintState],state=>{let{selected,panel}=state.field(lintState);return!selected||!panel||selected.from==selected.to?Decoration.none:Decoration.set([activeMark.range(selected.from,selected.to)]);}),/*@__PURE__*/hoverTooltip(lintTooltip,{hideOn:hideTooltip}),baseTheme];// (The superfluous function calls around the list of extensions work
// around current limitations in tree-shaking software.)
/**
  This is an extension value that just pulls together a number of
  extensions that you might want in a basic editor. It is meant as a
  convenient helper to quickly set up CodeMirror without installing
  and importing a lot of separate packages.

  Specifically, it includes...

   - [the default command bindings](https://codemirror.net/6/docs/ref/#commands.defaultKeymap)
   - [line numbers](https://codemirror.net/6/docs/ref/#view.lineNumbers)
   - [special character highlighting](https://codemirror.net/6/docs/ref/#view.highlightSpecialChars)
   - [the undo history](https://codemirror.net/6/docs/ref/#commands.history)
   - [a fold gutter](https://codemirror.net/6/docs/ref/#language.foldGutter)
   - [custom selection drawing](https://codemirror.net/6/docs/ref/#view.drawSelection)
   - [drop cursor](https://codemirror.net/6/docs/ref/#view.dropCursor)
   - [multiple selections](https://codemirror.net/6/docs/ref/#state.EditorState^allowMultipleSelections)
   - [reindentation on input](https://codemirror.net/6/docs/ref/#language.indentOnInput)
   - [the default highlight style](https://codemirror.net/6/docs/ref/#language.defaultHighlightStyle) (as fallback)
   - [bracket matching](https://codemirror.net/6/docs/ref/#language.bracketMatching)
   - [bracket closing](https://codemirror.net/6/docs/ref/#autocomplete.closeBrackets)
   - [autocompletion](https://codemirror.net/6/docs/ref/#autocomplete.autocompletion)
   - [rectangular selection](https://codemirror.net/6/docs/ref/#view.rectangularSelection) and [crosshair cursor](https://codemirror.net/6/docs/ref/#view.crosshairCursor)
   - [active line highlighting](https://codemirror.net/6/docs/ref/#view.highlightActiveLine)
   - [active line gutter highlighting](https://codemirror.net/6/docs/ref/#view.highlightActiveLineGutter)
   - [selection match highlighting](https://codemirror.net/6/docs/ref/#search.highlightSelectionMatches)
   - [search](https://codemirror.net/6/docs/ref/#search.searchKeymap)
   - [linting](https://codemirror.net/6/docs/ref/#lint.lintKeymap)

  (You'll probably want to add some language package to your setup
  too.)

  This extension does not allow customization. The idea is that,
  once you decide you want to configure your editor more precisely,
  you take this package's source (which is just a bunch of imports
  and an array literal), copy it into your own code, and adjust it
  as desired.
  */const basicSetup=/*@__PURE__*/(()=>[lineNumbers(),highlightActiveLineGutter(),highlightSpecialChars(),history(),foldGutter(),drawSelection(),dropCursor(),EditorState.allowMultipleSelections.of(true),indentOnInput(),syntaxHighlighting(defaultHighlightStyle,{fallback:true}),bracketMatching(),closeBrackets(),autocompletion(),rectangularSelection(),crosshairCursor(),highlightActiveLine(),highlightSelectionMatches(),keymap.of([...closeBracketsKeymap,...defaultKeymap,...searchKeymap,...historyKeymap,...foldKeymap,...completionKeymap,...lintKeymap])])();const config={dark:true,background:'#263238',foreground:'#EEFFFF',selection:'#80CBC420',cursor:'#FFCC00',dropdownBackground:'#263238',dropdownBorder:'#FFFFFF10',activeLine:'#4c616c22',lineNumber:'#37474F',lineNumberActive:'#607a86',matchingBracket:'#263238',keyword:'#C792EA',variable:'#EEFFFF',function:'#82AAFF',string:'#C3E88D',constant:'#F78C6C',type:'#B2CCD6',class:'#FFCB6B',number:'#F78C6C',comment:'#546E7A',heading:'#C3E88D',invalid:'#FF5370',regexp:'#89DDFF'};const materialDarkTheme=EditorView.theme({'&':{color:config.foreground,backgroundColor:config.background},'.cm-content':{caretColor:config.cursor},'.cm-cursor, .cm-dropCursor':{borderLeftColor:config.cursor},'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':{backgroundColor:config.selection},'.cm-panels':{backgroundColor:config.dropdownBackground,color:config.foreground},'.cm-panels.cm-panels-top':{borderBottom:'2px solid black'},'.cm-panels.cm-panels-bottom':{borderTop:'2px solid black'},'.cm-searchMatch':{backgroundColor:config.dropdownBackground,outline:`1px solid ${config.dropdownBorder}`},'.cm-searchMatch.cm-searchMatch-selected':{backgroundColor:config.selection},'.cm-activeLine':{backgroundColor:config.activeLine},'.cm-selectionMatch':{backgroundColor:config.selection},'&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket':{backgroundColor:config.matchingBracket,outline:'none'},'.cm-gutters':{backgroundColor:config.background,color:config.foreground,border:'none'},'.cm-activeLineGutter':{backgroundColor:config.background},'.cm-lineNumbers .cm-gutterElement':{color:config.lineNumber},'.cm-lineNumbers .cm-activeLineGutter':{color:config.lineNumberActive},'.cm-foldPlaceholder':{backgroundColor:'transparent',border:'none',color:config.foreground},'.cm-tooltip':{border:`1px solid ${config.dropdownBorder}`,backgroundColor:config.dropdownBackground,color:config.foreground},'.cm-tooltip .cm-tooltip-arrow:before':{borderTopColor:'transparent',borderBottomColor:'transparent'},'.cm-tooltip .cm-tooltip-arrow:after':{borderTopColor:config.foreground,borderBottomColor:config.foreground},'.cm-tooltip-autocomplete':{'& > ul > li[aria-selected]':{background:config.selection,color:config.foreground}}},{dark:config.dark});const materialDarkHighlightStyle=HighlightStyle.define([{tag:tags$1.keyword,color:config.keyword},{tag:[tags$1.name,tags$1.deleted,tags$1.character,tags$1.macroName],color:config.variable},{tag:[tags$1.propertyName],color:config.function},{tag:[tags$1.processingInstruction,tags$1.string,tags$1.inserted,tags$1.special(tags$1.string)],color:config.string},{tag:[tags$1.function(tags$1.variableName),tags$1.labelName],color:config.function},{tag:[tags$1.color,tags$1.constant(tags$1.name),tags$1.standard(tags$1.name)],color:config.constant},{tag:[tags$1.definition(tags$1.name),tags$1.separator],color:config.variable},{tag:[tags$1.className],color:config.class},{tag:[tags$1.number,tags$1.changed,tags$1.annotation,tags$1.modifier,tags$1.self,tags$1.namespace],color:config.number},{tag:[tags$1.typeName],color:config.type,fontStyle:config.type},{tag:[tags$1.operator,tags$1.operatorKeyword],color:config.keyword},{tag:[tags$1.url,tags$1.escape,tags$1.regexp,tags$1.link],color:config.regexp},{tag:[tags$1.meta,tags$1.comment],color:config.comment},{tag:tags$1.strong,fontWeight:'bold'},{tag:tags$1.emphasis,fontStyle:'italic'},{tag:tags$1.link,textDecoration:'underline'},{tag:tags$1.heading,fontWeight:'bold',color:config.heading},{tag:[tags$1.atom,tags$1.bool,tags$1.special(tags$1.variableName)],color:config.variable},{tag:tags$1.invalid,color:config.invalid},{tag:tags$1.strikethrough,textDecoration:'line-through'}]);const materialDark=[materialDarkTheme,syntaxHighlighting(materialDarkHighlightStyle)];/**
  A parse stack. These are used internally by the parser to track
  parsing progress. They also provide some properties and methods
  that external code such as a tokenizer can use to get information
  about the parse state.
  */class Stack{/**
      @internal
      */constructor(/**
      The parse that this stack is part of @internal
      */p,/**
      Holds state, input pos, buffer index triplets for all but the
      top state @internal
      */stack,/**
      The current parse state @internal
      */state,// The position at which the next reduce should take place. This
// can be less than `this.pos` when skipped expressions have been
// added to the stack (which should be moved outside of the next
// reduction)
/**
      @internal
      */reducePos,/**
      The input position up to which this stack has parsed.
      */pos,/**
      The dynamic score of the stack, including dynamic precedence
      and error-recovery penalties
      @internal
      */score,// The output buffer. Holds (type, start, end, size) quads
// representing nodes created by the parser, where `size` is
// amount of buffer array entries covered by this node.
/**
      @internal
      */buffer,// The base offset of the buffer. When stacks are split, the split
// instance shared the buffer history with its parent up to
// `bufferBase`, which is the absolute offset (including the
// offset of previous splits) into the buffer at which this stack
// starts writing.
/**
      @internal
      */bufferBase,/**
      @internal
      */curContext,/**
      @internal
      */lookAhead=0,// A parent stack from which this was split off, if any. This is
// set up so that it always points to a stack that has some
// additional buffer content, never to a stack with an equal
// `bufferBase`.
/**
      @internal
      */parent){this.p=p;this.stack=stack;this.state=state;this.reducePos=reducePos;this.pos=pos;this.score=score;this.buffer=buffer;this.bufferBase=bufferBase;this.curContext=curContext;this.lookAhead=lookAhead;this.parent=parent;}/**
      @internal
      */toString(){return`[${this.stack.filter((_,i)=>i%3==0).concat(this.state)}]@${this.pos}${this.score?"!"+this.score:""}`;}// Start an empty stack
/**
      @internal
      */static start(p,state,pos=0){let cx=p.parser.context;return new Stack(p,[],state,pos,pos,0,[],0,cx?new StackContext(cx,cx.start):null,0,null);}/**
      The stack's current [context](#lr.ContextTracker) value, if
      any. Its type will depend on the context tracker's type
      parameter, or it will be `null` if there is no context
      tracker.
      */get context(){return this.curContext?this.curContext.context:null;}// Push a state onto the stack, tracking its start position as well
// as the buffer base at that point.
/**
      @internal
      */pushState(state,start){this.stack.push(this.state,start,this.bufferBase+this.buffer.length);this.state=state;}// Apply a reduce action
/**
      @internal
      */reduce(action){var _a;let depth=action>>19/* Action.ReduceDepthShift */,type=action&65535/* Action.ValueMask */;let{parser}=this.p;let dPrec=parser.dynamicPrecedence(type);if(dPrec)this.score+=dPrec;if(depth==0){this.pushState(parser.getGoto(this.state,type,true),this.reducePos);// Zero-depth reductions are a special case—they add stuff to
// the stack without popping anything off.
if(type<parser.minRepeatTerm)this.storeNode(type,this.reducePos,this.reducePos,4,true);this.reduceContext(type,this.reducePos);return;}// Find the base index into `this.stack`, content after which will
// be dropped. Note that with `StayFlag` reductions we need to
// consume two extra frames (the dummy parent node for the skipped
// expression and the state that we'll be staying in, which should
// be moved to `this.state`).
let base=this.stack.length-(depth-1)*3-(action&262144/* Action.StayFlag */?6:0);let start=base?this.stack[base-2]:this.p.ranges[0].from,size=this.reducePos-start;// This is a kludge to try and detect overly deep left-associative
// trees, which will not increase the parse stack depth and thus
// won't be caught by the regular stack-depth limit check.
if(size>=2000/* Recover.MinBigReduction */&&!((_a=this.p.parser.nodeSet.types[type])===null||_a===void 0?void 0:_a.isAnonymous)){if(start==this.p.lastBigReductionStart){this.p.bigReductionCount++;this.p.lastBigReductionSize=size;}else if(this.p.lastBigReductionSize<size){this.p.bigReductionCount=1;this.p.lastBigReductionStart=start;this.p.lastBigReductionSize=size;}}let bufferBase=base?this.stack[base-1]:0,count=this.bufferBase+this.buffer.length-bufferBase;// Store normal terms or `R -> R R` repeat reductions
if(type<parser.minRepeatTerm||action&131072/* Action.RepeatFlag */){let pos=parser.stateFlag(this.state,1/* StateFlag.Skipped */)?this.pos:this.reducePos;this.storeNode(type,start,pos,count+4,true);}if(action&262144/* Action.StayFlag */){this.state=this.stack[base];}else{let baseStateID=this.stack[base-3];this.state=parser.getGoto(baseStateID,type,true);}while(this.stack.length>base)this.stack.pop();this.reduceContext(type,start);}// Shift a value into the buffer
/**
      @internal
      */storeNode(term,start,end,size=4,isReduce=false){if(term==0/* Term.Err */&&(!this.stack.length||this.stack[this.stack.length-1]<this.buffer.length+this.bufferBase)){// Try to omit/merge adjacent error nodes
let cur=this,top=this.buffer.length;if(top==0&&cur.parent){top=cur.bufferBase-cur.parent.bufferBase;cur=cur.parent;}if(top>0&&cur.buffer[top-4]==0/* Term.Err */&&cur.buffer[top-1]>-1){if(start==end)return;if(cur.buffer[top-2]>=start){cur.buffer[top-2]=end;return;}}}if(!isReduce||this.pos==end){// Simple case, just append
this.buffer.push(term,start,end,size);}else{// There may be skipped nodes that have to be moved forward
let index=this.buffer.length;if(index>0&&this.buffer[index-4]!=0/* Term.Err */)while(index>0&&this.buffer[index-2]>end){// Move this record forward
this.buffer[index]=this.buffer[index-4];this.buffer[index+1]=this.buffer[index-3];this.buffer[index+2]=this.buffer[index-2];this.buffer[index+3]=this.buffer[index-1];index-=4;if(size>4)size-=4;}this.buffer[index]=term;this.buffer[index+1]=start;this.buffer[index+2]=end;this.buffer[index+3]=size;}}// Apply a shift action
/**
      @internal
      */shift(action,type,start,end){if(action&131072/* Action.GotoFlag */){this.pushState(action&65535/* Action.ValueMask */,this.pos);}else if((action&262144/* Action.StayFlag */)==0){// Regular shift
let nextState=action,{parser}=this.p;if(end>this.pos||type<=parser.maxNode){this.pos=end;if(!parser.stateFlag(nextState,1/* StateFlag.Skipped */))this.reducePos=end;}this.pushState(nextState,start);this.shiftContext(type,start);if(type<=parser.maxNode)this.buffer.push(type,start,end,4);}else{// Shift-and-stay, which means this is a skipped token
this.pos=end;this.shiftContext(type,start);if(type<=this.p.parser.maxNode)this.buffer.push(type,start,end,4);}}// Apply an action
/**
      @internal
      */apply(action,next,nextStart,nextEnd){if(action&65536/* Action.ReduceFlag */)this.reduce(action);else this.shift(action,next,nextStart,nextEnd);}// Add a prebuilt (reused) node into the buffer.
/**
      @internal
      */useNode(value,next){let index=this.p.reused.length-1;if(index<0||this.p.reused[index]!=value){this.p.reused.push(value);index++;}let start=this.pos;this.reducePos=this.pos=start+value.length;this.pushState(next,start);this.buffer.push(index,start,this.reducePos,-1/* size == -1 means this is a reused value */);if(this.curContext)this.updateContext(this.curContext.tracker.reuse(this.curContext.context,value,this,this.p.stream.reset(this.pos-value.length)));}// Split the stack. Due to the buffer sharing and the fact
// that `this.stack` tends to stay quite shallow, this isn't very
// expensive.
/**
      @internal
      */split(){let parent=this;let off=parent.buffer.length;// Because the top of the buffer (after this.pos) may be mutated
// to reorder reductions and skipped tokens, and shared buffers
// should be immutable, this copies any outstanding skipped tokens
// to the new buffer, and puts the base pointer before them.
while(off>0&&parent.buffer[off-2]>parent.reducePos)off-=4;let buffer=parent.buffer.slice(off),base=parent.bufferBase+off;// Make sure parent points to an actual parent with content, if there is such a parent.
while(parent&&base==parent.bufferBase)parent=parent.parent;return new Stack(this.p,this.stack.slice(),this.state,this.reducePos,this.pos,this.score,buffer,base,this.curContext,this.lookAhead,parent);}// Try to recover from an error by 'deleting' (ignoring) one token.
/**
      @internal
      */recoverByDelete(next,nextEnd){let isNode=next<=this.p.parser.maxNode;if(isNode)this.storeNode(next,this.pos,nextEnd,4);this.storeNode(0/* Term.Err */,this.pos,nextEnd,isNode?8:4);this.pos=this.reducePos=nextEnd;this.score-=190/* Recover.Delete */;}/**
      Check if the given term would be able to be shifted (optionally
      after some reductions) on this stack. This can be useful for
      external tokenizers that want to make sure they only provide a
      given token when it applies.
      */canShift(term){for(let sim=new SimulatedStack(this);;){let action=this.p.parser.stateSlot(sim.state,4/* ParseState.DefaultReduce */)||this.p.parser.hasAction(sim.state,term);if(action==0)return false;if((action&65536/* Action.ReduceFlag */)==0)return true;sim.reduce(action);}}// Apply up to Recover.MaxNext recovery actions that conceptually
// inserts some missing token or rule.
/**
      @internal
      */recoverByInsert(next){if(this.stack.length>=300/* Recover.MaxInsertStackDepth */)return[];let nextStates=this.p.parser.nextStates(this.state);if(nextStates.length>4/* Recover.MaxNext */<<1||this.stack.length>=120/* Recover.DampenInsertStackDepth */){let best=[];for(let i=0,s;i<nextStates.length;i+=2){if((s=nextStates[i+1])!=this.state&&this.p.parser.hasAction(s,next))best.push(nextStates[i],s);}if(this.stack.length<120/* Recover.DampenInsertStackDepth */)for(let i=0;best.length<4/* Recover.MaxNext */<<1&&i<nextStates.length;i+=2){let s=nextStates[i+1];if(!best.some((v,i)=>i&1&&v==s))best.push(nextStates[i],s);}nextStates=best;}let result=[];for(let i=0;i<nextStates.length&&result.length<4/* Recover.MaxNext */;i+=2){let s=nextStates[i+1];if(s==this.state)continue;let stack=this.split();stack.pushState(s,this.pos);stack.storeNode(0/* Term.Err */,stack.pos,stack.pos,4,true);stack.shiftContext(nextStates[i],this.pos);stack.reducePos=this.pos;stack.score-=200/* Recover.Insert */;result.push(stack);}return result;}// Force a reduce, if possible. Return false if that can't
// be done.
/**
      @internal
      */forceReduce(){let{parser}=this.p;let reduce=parser.stateSlot(this.state,5/* ParseState.ForcedReduce */);if((reduce&65536/* Action.ReduceFlag */)==0)return false;if(!parser.validAction(this.state,reduce)){let depth=reduce>>19/* Action.ReduceDepthShift */,term=reduce&65535/* Action.ValueMask */;let target=this.stack.length-depth*3;if(target<0||parser.getGoto(this.stack[target],term,false)<0){let backup=this.findForcedReduction();if(backup==null)return false;reduce=backup;}this.storeNode(0/* Term.Err */,this.pos,this.pos,4,true);this.score-=100/* Recover.Reduce */;}this.reducePos=this.pos;this.reduce(reduce);return true;}/**
      Try to scan through the automaton to find some kind of reduction
      that can be applied. Used when the regular ForcedReduce field
      isn't a valid action. @internal
      */findForcedReduction(){let{parser}=this.p,seen=[];let explore=(state,depth)=>{if(seen.includes(state))return;seen.push(state);return parser.allActions(state,action=>{if(action&(262144/* Action.StayFlag */|131072/* Action.GotoFlag */));else if(action&65536/* Action.ReduceFlag */){let rDepth=(action>>19/* Action.ReduceDepthShift */)-depth;if(rDepth>1){let term=action&65535/* Action.ValueMask */,target=this.stack.length-rDepth*3;if(target>=0&&parser.getGoto(this.stack[target],term,false)>=0)return rDepth<<19/* Action.ReduceDepthShift */|65536/* Action.ReduceFlag */|term;}}else{let found=explore(action,depth+1);if(found!=null)return found;}});};return explore(this.state,0);}/**
      @internal
      */forceAll(){while(!this.p.parser.stateFlag(this.state,2/* StateFlag.Accepting */)){if(!this.forceReduce()){this.storeNode(0/* Term.Err */,this.pos,this.pos,4,true);break;}}return this;}/**
      Check whether this state has no further actions (assumed to be a direct descendant of the
      top state, since any other states must be able to continue
      somehow). @internal
      */get deadEnd(){if(this.stack.length!=3)return false;let{parser}=this.p;return parser.data[parser.stateSlot(this.state,1/* ParseState.Actions */)]==65535/* Seq.End */&&!parser.stateSlot(this.state,4/* ParseState.DefaultReduce */);}/**
      Restart the stack (put it back in its start state). Only safe
      when this.stack.length == 3 (state is directly below the top
      state). @internal
      */restart(){this.storeNode(0/* Term.Err */,this.pos,this.pos,4,true);this.state=this.stack[0];this.stack.length=0;}/**
      @internal
      */sameState(other){if(this.state!=other.state||this.stack.length!=other.stack.length)return false;for(let i=0;i<this.stack.length;i+=3)if(this.stack[i]!=other.stack[i])return false;return true;}/**
      Get the parser used by this stack.
      */get parser(){return this.p.parser;}/**
      Test whether a given dialect (by numeric ID, as exported from
      the terms file) is enabled.
      */dialectEnabled(dialectID){return this.p.parser.dialect.flags[dialectID];}shiftContext(term,start){if(this.curContext)this.updateContext(this.curContext.tracker.shift(this.curContext.context,term,this,this.p.stream.reset(start)));}reduceContext(term,start){if(this.curContext)this.updateContext(this.curContext.tracker.reduce(this.curContext.context,term,this,this.p.stream.reset(start)));}/**
      @internal
      */emitContext(){let last=this.buffer.length-1;if(last<0||this.buffer[last]!=-3)this.buffer.push(this.curContext.hash,this.pos,this.pos,-3);}/**
      @internal
      */emitLookAhead(){let last=this.buffer.length-1;if(last<0||this.buffer[last]!=-4)this.buffer.push(this.lookAhead,this.pos,this.pos,-4);}updateContext(context){if(context!=this.curContext.context){let newCx=new StackContext(this.curContext.tracker,context);if(newCx.hash!=this.curContext.hash)this.emitContext();this.curContext=newCx;}}/**
      @internal
      */setLookAhead(lookAhead){if(lookAhead>this.lookAhead){this.emitLookAhead();this.lookAhead=lookAhead;}}/**
      @internal
      */close(){if(this.curContext&&this.curContext.tracker.strict)this.emitContext();if(this.lookAhead>0)this.emitLookAhead();}}class StackContext{constructor(tracker,context){this.tracker=tracker;this.context=context;this.hash=tracker.strict?tracker.hash(context):0;}}// Used to cheaply run some reductions to scan ahead without mutating
// an entire stack
class SimulatedStack{constructor(start){this.start=start;this.state=start.state;this.stack=start.stack;this.base=this.stack.length;}reduce(action){let term=action&65535/* Action.ValueMask */,depth=action>>19/* Action.ReduceDepthShift */;if(depth==0){if(this.stack==this.start.stack)this.stack=this.stack.slice();this.stack.push(this.state,0,0);this.base+=3;}else{this.base-=(depth-1)*3;}let goto=this.start.p.parser.getGoto(this.stack[this.base-3],term,true);this.state=goto;}}// This is given to `Tree.build` to build a buffer, and encapsulates
// the parent-stack-walking necessary to read the nodes.
class StackBufferCursor{constructor(stack,pos,index){this.stack=stack;this.pos=pos;this.index=index;this.buffer=stack.buffer;if(this.index==0)this.maybeNext();}static create(stack,pos=stack.bufferBase+stack.buffer.length){return new StackBufferCursor(stack,pos,pos-stack.bufferBase);}maybeNext(){let next=this.stack.parent;if(next!=null){this.index=this.stack.bufferBase-next.bufferBase;this.stack=next;this.buffer=next.buffer;}}get id(){return this.buffer[this.index-4];}get start(){return this.buffer[this.index-3];}get end(){return this.buffer[this.index-2];}get size(){return this.buffer[this.index-1];}next(){this.index-=4;this.pos-=4;if(this.index==0)this.maybeNext();}fork(){return new StackBufferCursor(this.stack,this.pos,this.index);}}// See lezer-generator/src/encode.ts for comments about the encoding
// used here
function decodeArray(input,Type=Uint16Array){if(typeof input!="string")return input;let array=null;for(let pos=0,out=0;pos<input.length;){let value=0;for(;;){let next=input.charCodeAt(pos++),stop=false;if(next==126/* Encode.BigValCode */){value=65535/* Encode.BigVal */;break;}if(next>=92/* Encode.Gap2 */)next--;if(next>=34/* Encode.Gap1 */)next--;let digit=next-32/* Encode.Start */;if(digit>=46/* Encode.Base */){digit-=46/* Encode.Base */;stop=true;}value+=digit;if(stop)break;value*=46/* Encode.Base */;}if(array)array[out++]=value;else array=new Type(value);}return array;}class CachedToken{constructor(){this.start=-1;this.value=-1;this.end=-1;this.extended=-1;this.lookAhead=0;this.mask=0;this.context=0;}}const nullToken=new CachedToken();/**
  [Tokenizers](#lr.ExternalTokenizer) interact with the input
  through this interface. It presents the input as a stream of
  characters, tracking lookahead and hiding the complexity of
  [ranges](#common.Parser.parse^ranges) from tokenizer code.
  */class InputStream{/**
      @internal
      */constructor(/**
      @internal
      */input,/**
      @internal
      */ranges){this.input=input;this.ranges=ranges;/**
          @internal
          */this.chunk="";/**
          @internal
          */this.chunkOff=0;/**
          Backup chunk
          */this.chunk2="";this.chunk2Pos=0;/**
          The character code of the next code unit in the input, or -1
          when the stream is at the end of the input.
          */this.next=-1;/**
          @internal
          */this.token=nullToken;this.rangeIndex=0;this.pos=this.chunkPos=ranges[0].from;this.range=ranges[0];this.end=ranges[ranges.length-1].to;this.readNext();}/**
      @internal
      */resolveOffset(offset,assoc){let range=this.range,index=this.rangeIndex;let pos=this.pos+offset;while(pos<range.from){if(!index)return null;let next=this.ranges[--index];pos-=range.from-next.to;range=next;}while(assoc<0?pos>range.to:pos>=range.to){if(index==this.ranges.length-1)return null;let next=this.ranges[++index];pos+=next.from-range.to;range=next;}return pos;}/**
      @internal
      */clipPos(pos){if(pos>=this.range.from&&pos<this.range.to)return pos;for(let range of this.ranges)if(range.to>pos)return Math.max(pos,range.from);return this.end;}/**
      Look at a code unit near the stream position. `.peek(0)` equals
      `.next`, `.peek(-1)` gives you the previous character, and so
      on.
      
      Note that looking around during tokenizing creates dependencies
      on potentially far-away content, which may reduce the
      effectiveness incremental parsing—when looking forward—or even
      cause invalid reparses when looking backward more than 25 code
      units, since the library does not track lookbehind.
      */peek(offset){let idx=this.chunkOff+offset,pos,result;if(idx>=0&&idx<this.chunk.length){pos=this.pos+offset;result=this.chunk.charCodeAt(idx);}else{let resolved=this.resolveOffset(offset,1);if(resolved==null)return-1;pos=resolved;if(pos>=this.chunk2Pos&&pos<this.chunk2Pos+this.chunk2.length){result=this.chunk2.charCodeAt(pos-this.chunk2Pos);}else{let i=this.rangeIndex,range=this.range;while(range.to<=pos)range=this.ranges[++i];this.chunk2=this.input.chunk(this.chunk2Pos=pos);if(pos+this.chunk2.length>range.to)this.chunk2=this.chunk2.slice(0,range.to-pos);result=this.chunk2.charCodeAt(0);}}if(pos>=this.token.lookAhead)this.token.lookAhead=pos+1;return result;}/**
      Accept a token. By default, the end of the token is set to the
      current stream position, but you can pass an offset (relative to
      the stream position) to change that.
      */acceptToken(token,endOffset=0){let end=endOffset?this.resolveOffset(endOffset,-1):this.pos;if(end==null||end<this.token.start)throw new RangeError("Token end out of bounds");this.token.value=token;this.token.end=end;}/**
      Accept a token ending at a specific given position.
      */acceptTokenTo(token,endPos){this.token.value=token;this.token.end=endPos;}getChunk(){if(this.pos>=this.chunk2Pos&&this.pos<this.chunk2Pos+this.chunk2.length){let{chunk,chunkPos}=this;this.chunk=this.chunk2;this.chunkPos=this.chunk2Pos;this.chunk2=chunk;this.chunk2Pos=chunkPos;this.chunkOff=this.pos-this.chunkPos;}else{this.chunk2=this.chunk;this.chunk2Pos=this.chunkPos;let nextChunk=this.input.chunk(this.pos);let end=this.pos+nextChunk.length;this.chunk=end>this.range.to?nextChunk.slice(0,this.range.to-this.pos):nextChunk;this.chunkPos=this.pos;this.chunkOff=0;}}readNext(){if(this.chunkOff>=this.chunk.length){this.getChunk();if(this.chunkOff==this.chunk.length)return this.next=-1;}return this.next=this.chunk.charCodeAt(this.chunkOff);}/**
      Move the stream forward N (defaults to 1) code units. Returns
      the new value of [`next`](#lr.InputStream.next).
      */advance(n=1){this.chunkOff+=n;while(this.pos+n>=this.range.to){if(this.rangeIndex==this.ranges.length-1)return this.setDone();n-=this.range.to-this.pos;this.range=this.ranges[++this.rangeIndex];this.pos=this.range.from;}this.pos+=n;if(this.pos>=this.token.lookAhead)this.token.lookAhead=this.pos+1;return this.readNext();}setDone(){this.pos=this.chunkPos=this.end;this.range=this.ranges[this.rangeIndex=this.ranges.length-1];this.chunk="";return this.next=-1;}/**
      @internal
      */reset(pos,token){if(token){this.token=token;token.start=pos;token.lookAhead=pos+1;token.value=token.extended=-1;}else{this.token=nullToken;}if(this.pos!=pos){this.pos=pos;if(pos==this.end){this.setDone();return this;}while(pos<this.range.from)this.range=this.ranges[--this.rangeIndex];while(pos>=this.range.to)this.range=this.ranges[++this.rangeIndex];if(pos>=this.chunkPos&&pos<this.chunkPos+this.chunk.length){this.chunkOff=pos-this.chunkPos;}else{this.chunk="";this.chunkOff=0;}this.readNext();}return this;}/**
      @internal
      */read(from,to){if(from>=this.chunkPos&&to<=this.chunkPos+this.chunk.length)return this.chunk.slice(from-this.chunkPos,to-this.chunkPos);if(from>=this.chunk2Pos&&to<=this.chunk2Pos+this.chunk2.length)return this.chunk2.slice(from-this.chunk2Pos,to-this.chunk2Pos);if(from>=this.range.from&&to<=this.range.to)return this.input.read(from,to);let result="";for(let r of this.ranges){if(r.from>=to)break;if(r.to>from)result+=this.input.read(Math.max(r.from,from),Math.min(r.to,to));}return result;}}/**
  @internal
  */class TokenGroup{constructor(data,id){this.data=data;this.id=id;}token(input,stack){let{parser}=stack.p;readToken(this.data,input,stack,this.id,parser.data,parser.tokenPrecTable);}}TokenGroup.prototype.contextual=TokenGroup.prototype.fallback=TokenGroup.prototype.extend=false;/**
  @hide
  */class LocalTokenGroup{constructor(data,precTable,elseToken){this.precTable=precTable;this.elseToken=elseToken;this.data=typeof data=="string"?decodeArray(data):data;}token(input,stack){let start=input.pos,skipped=0;for(;;){let atEof=input.next<0,nextPos=input.resolveOffset(1,1);readToken(this.data,input,stack,0,this.data,this.precTable);if(input.token.value>-1)break;if(this.elseToken==null)return;if(!atEof)skipped++;if(nextPos==null)break;input.reset(nextPos,input.token);}if(skipped){input.reset(start,input.token);input.acceptToken(this.elseToken,skipped);}}}LocalTokenGroup.prototype.contextual=TokenGroup.prototype.fallback=TokenGroup.prototype.extend=false;/**
  `@external tokens` declarations in the grammar should resolve to
  an instance of this class.
  */class ExternalTokenizer{/**
      Create a tokenizer. The first argument is the function that,
      given an input stream, scans for the types of tokens it
      recognizes at the stream's position, and calls
      [`acceptToken`](#lr.InputStream.acceptToken) when it finds
      one.
      */constructor(/**
      @internal
      */token,options={}){this.token=token;this.contextual=!!options.contextual;this.fallback=!!options.fallback;this.extend=!!options.extend;}}// Tokenizer data is stored a big uint16 array containing, for each
// state:
//
//  - A group bitmask, indicating what token groups are reachable from
//    this state, so that paths that can only lead to tokens not in
//    any of the current groups can be cut off early.
//
//  - The position of the end of the state's sequence of accepting
//    tokens
//
//  - The number of outgoing edges for the state
//
//  - The accepting tokens, as (token id, group mask) pairs
//
//  - The outgoing edges, as (start character, end character, state
//    index) triples, with end character being exclusive
//
// This function interprets that data, running through a stream as
// long as new states with the a matching group mask can be reached,
// and updating `input.token` when it matches a token.
function readToken(data,input,stack,group,precTable,precOffset){let state=0,groupMask=1<<group,{dialect}=stack.p.parser;scan:for(;;){if((groupMask&data[state])==0)break;let accEnd=data[state+1];// Check whether this state can lead to a token in the current group
// Accept tokens in this state, possibly overwriting
// lower-precedence / shorter tokens
for(let i=state+3;i<accEnd;i+=2)if((data[i+1]&groupMask)>0){let term=data[i];if(dialect.allows(term)&&(input.token.value==-1||input.token.value==term||overrides(term,input.token.value,precTable,precOffset))){input.acceptToken(term);break;}}let next=input.next,low=0,high=data[state+2];// Special case for EOF
if(input.next<0&&high>low&&data[accEnd+high*3-3]==65535/* Seq.End */){state=data[accEnd+high*3-1];continue scan;}// Do a binary search on the state's edges
for(;low<high;){let mid=low+high>>1;let index=accEnd+mid+(mid<<1);let from=data[index],to=data[index+1]||0x10000;if(next<from)high=mid;else if(next>=to)low=mid+1;else{state=data[index+2];input.advance();continue scan;}}break;}}function findOffset(data,start,term){for(let i=start,next;(next=data[i])!=65535/* Seq.End */;i++)if(next==term)return i-start;return-1;}function overrides(token,prev,tableData,tableOffset){let iPrev=findOffset(tableData,tableOffset,prev);return iPrev<0||findOffset(tableData,tableOffset,token)<iPrev;}// Environment variable used to control console output
const verbose=typeof process!="undefined"&&process.env&&/\bparse\b/.test(process.env.LOG);let stackIDs=null;function cutAt(tree,pos,side){let cursor=tree.cursor(IterMode.IncludeAnonymous);cursor.moveTo(pos);for(;;){if(!(side<0?cursor.childBefore(pos):cursor.childAfter(pos)))for(;;){if((side<0?cursor.to<pos:cursor.from>pos)&&!cursor.type.isError)return side<0?Math.max(0,Math.min(cursor.to-1,pos-25/* Safety.Margin */)):Math.min(tree.length,Math.max(cursor.from+1,pos+25/* Safety.Margin */));if(side<0?cursor.prevSibling():cursor.nextSibling())break;if(!cursor.parent())return side<0?0:tree.length;}}}class FragmentCursor{constructor(fragments,nodeSet){this.fragments=fragments;this.nodeSet=nodeSet;this.i=0;this.fragment=null;this.safeFrom=-1;this.safeTo=-1;this.trees=[];this.start=[];this.index=[];this.nextFragment();}nextFragment(){let fr=this.fragment=this.i==this.fragments.length?null:this.fragments[this.i++];if(fr){this.safeFrom=fr.openStart?cutAt(fr.tree,fr.from+fr.offset,1)-fr.offset:fr.from;this.safeTo=fr.openEnd?cutAt(fr.tree,fr.to+fr.offset,-1)-fr.offset:fr.to;while(this.trees.length){this.trees.pop();this.start.pop();this.index.pop();}this.trees.push(fr.tree);this.start.push(-fr.offset);this.index.push(0);this.nextStart=this.safeFrom;}else{this.nextStart=1e9;}}// `pos` must be >= any previously given `pos` for this cursor
nodeAt(pos){if(pos<this.nextStart)return null;while(this.fragment&&this.safeTo<=pos)this.nextFragment();if(!this.fragment)return null;for(;;){let last=this.trees.length-1;if(last<0){// End of tree
this.nextFragment();return null;}let top=this.trees[last],index=this.index[last];if(index==top.children.length){this.trees.pop();this.start.pop();this.index.pop();continue;}let next=top.children[index];let start=this.start[last]+top.positions[index];if(start>pos){this.nextStart=start;return null;}if(next instanceof Tree){if(start==pos){if(start<this.safeFrom)return null;let end=start+next.length;if(end<=this.safeTo){let lookAhead=next.prop(NodeProp.lookAhead);if(!lookAhead||end+lookAhead<this.fragment.to)return next;}}this.index[last]++;if(start+next.length>=Math.max(this.safeFrom,pos)){// Enter this node
this.trees.push(next);this.start.push(start);this.index.push(0);}}else{this.index[last]++;this.nextStart=start+next.length;}}}}class TokenCache{constructor(parser,stream){this.stream=stream;this.tokens=[];this.mainToken=null;this.actions=[];this.tokens=parser.tokenizers.map(_=>new CachedToken());}getActions(stack){let actionIndex=0;let main=null;let{parser}=stack.p,{tokenizers}=parser;let mask=parser.stateSlot(stack.state,3/* ParseState.TokenizerMask */);let context=stack.curContext?stack.curContext.hash:0;let lookAhead=0;for(let i=0;i<tokenizers.length;i++){if((1<<i&mask)==0)continue;let tokenizer=tokenizers[i],token=this.tokens[i];if(main&&!tokenizer.fallback)continue;if(tokenizer.contextual||token.start!=stack.pos||token.mask!=mask||token.context!=context){this.updateCachedToken(token,tokenizer,stack);token.mask=mask;token.context=context;}if(token.lookAhead>token.end+25/* Safety.Margin */)lookAhead=Math.max(token.lookAhead,lookAhead);if(token.value!=0/* Term.Err */){let startIndex=actionIndex;if(token.extended>-1)actionIndex=this.addActions(stack,token.extended,token.end,actionIndex);actionIndex=this.addActions(stack,token.value,token.end,actionIndex);if(!tokenizer.extend){main=token;if(actionIndex>startIndex)break;}}}while(this.actions.length>actionIndex)this.actions.pop();if(lookAhead)stack.setLookAhead(lookAhead);if(!main&&stack.pos==this.stream.end){main=new CachedToken();main.value=stack.p.parser.eofTerm;main.start=main.end=stack.pos;actionIndex=this.addActions(stack,main.value,main.end,actionIndex);}this.mainToken=main;return this.actions;}getMainToken(stack){if(this.mainToken)return this.mainToken;let main=new CachedToken(),{pos,p}=stack;main.start=pos;main.end=Math.min(pos+1,p.stream.end);main.value=pos==p.stream.end?p.parser.eofTerm:0/* Term.Err */;return main;}updateCachedToken(token,tokenizer,stack){let start=this.stream.clipPos(stack.pos);tokenizer.token(this.stream.reset(start,token),stack);if(token.value>-1){let{parser}=stack.p;for(let i=0;i<parser.specialized.length;i++)if(parser.specialized[i]==token.value){let result=parser.specializers[i](this.stream.read(token.start,token.end),stack);if(result>=0&&stack.p.parser.dialect.allows(result>>1)){if((result&1)==0/* Specialize.Specialize */)token.value=result>>1;else token.extended=result>>1;break;}}}else{token.value=0/* Term.Err */;token.end=this.stream.clipPos(start+1);}}putAction(action,token,end,index){// Don't add duplicate actions
for(let i=0;i<index;i+=3)if(this.actions[i]==action)return index;this.actions[index++]=action;this.actions[index++]=token;this.actions[index++]=end;return index;}addActions(stack,token,end,index){let{state}=stack,{parser}=stack.p,{data}=parser;for(let set=0;set<2;set++){for(let i=parser.stateSlot(state,set?2/* ParseState.Skip */:1/* ParseState.Actions */);;i+=3){if(data[i]==65535/* Seq.End */){if(data[i+1]==1/* Seq.Next */){i=pair(data,i+2);}else{if(index==0&&data[i+1]==2/* Seq.Other */)index=this.putAction(pair(data,i+2),token,end,index);break;}}if(data[i]==token)index=this.putAction(pair(data,i+1),token,end,index);}}return index;}}class Parse{constructor(parser,input,fragments,ranges){this.parser=parser;this.input=input;this.ranges=ranges;this.recovering=0;this.nextStackID=0x2654;// ♔, ♕, ♖, ♗, ♘, ♙, ♠, ♡, ♢, ♣, ♤, ♥, ♦, ♧
this.minStackPos=0;this.reused=[];this.stoppedAt=null;this.lastBigReductionStart=-1;this.lastBigReductionSize=0;this.bigReductionCount=0;this.stream=new InputStream(input,ranges);this.tokens=new TokenCache(parser,this.stream);this.topTerm=parser.top[1];let{from}=ranges[0];this.stacks=[Stack.start(this,parser.top[0],from)];this.fragments=fragments.length&&this.stream.end-from>parser.bufferLength*4?new FragmentCursor(fragments,parser.nodeSet):null;}get parsedPos(){return this.minStackPos;}// Move the parser forward. This will process all parse stacks at
// `this.pos` and try to advance them to a further position. If no
// stack for such a position is found, it'll start error-recovery.
//
// When the parse is finished, this will return a syntax tree. When
// not, it returns `null`.
advance(){let stacks=this.stacks,pos=this.minStackPos;// This will hold stacks beyond `pos`.
let newStacks=this.stacks=[];let stopped,stoppedTokens;// If a large amount of reductions happened with the same start
// position, force the stack out of that production in order to
// avoid creating a tree too deep to recurse through.
// (This is an ugly kludge, because unfortunately there is no
// straightforward, cheap way to check for this happening, due to
// the history of reductions only being available in an
// expensive-to-access format in the stack buffers.)
if(this.bigReductionCount>300/* Rec.MaxLeftAssociativeReductionCount */&&stacks.length==1){let[s]=stacks;while(s.forceReduce()&&s.stack.length&&s.stack[s.stack.length-2]>=this.lastBigReductionStart){}this.bigReductionCount=this.lastBigReductionSize=0;}// Keep advancing any stacks at `pos` until they either move
// forward or can't be advanced. Gather stacks that can't be
// advanced further in `stopped`.
for(let i=0;i<stacks.length;i++){let stack=stacks[i];for(;;){this.tokens.mainToken=null;if(stack.pos>pos){newStacks.push(stack);}else if(this.advanceStack(stack,newStacks,stacks)){continue;}else{if(!stopped){stopped=[];stoppedTokens=[];}stopped.push(stack);let tok=this.tokens.getMainToken(stack);stoppedTokens.push(tok.value,tok.end);}break;}}if(!newStacks.length){let finished=stopped&&findFinished(stopped);if(finished){if(verbose)void 0;return this.stackToTree(finished);}if(this.parser.strict){if(verbose&&stopped)void 0;throw new SyntaxError("No parse at "+pos);}if(!this.recovering)this.recovering=5/* Rec.Distance */;}if(this.recovering&&stopped){let finished=this.stoppedAt!=null&&stopped[0].pos>this.stoppedAt?stopped[0]:this.runRecovery(stopped,stoppedTokens,newStacks);if(finished){if(verbose)void 0;return this.stackToTree(finished.forceAll());}}if(this.recovering){let maxRemaining=this.recovering==1?1:this.recovering*3/* Rec.MaxRemainingPerStep */;if(newStacks.length>maxRemaining){newStacks.sort((a,b)=>b.score-a.score);while(newStacks.length>maxRemaining)newStacks.pop();}if(newStacks.some(s=>s.reducePos>pos))this.recovering--;}else if(newStacks.length>1){// Prune stacks that are in the same state, or that have been
// running without splitting for a while, to avoid getting stuck
// with multiple successful stacks running endlessly on.
outer:for(let i=0;i<newStacks.length-1;i++){let stack=newStacks[i];for(let j=i+1;j<newStacks.length;j++){let other=newStacks[j];if(stack.sameState(other)||stack.buffer.length>500/* Rec.MinBufferLengthPrune */&&other.buffer.length>500/* Rec.MinBufferLengthPrune */){if((stack.score-other.score||stack.buffer.length-other.buffer.length)>0){newStacks.splice(j--,1);}else{newStacks.splice(i--,1);continue outer;}}}}if(newStacks.length>12/* Rec.MaxStackCount */)newStacks.splice(12/* Rec.MaxStackCount */,newStacks.length-12/* Rec.MaxStackCount */);}this.minStackPos=newStacks[0].pos;for(let i=1;i<newStacks.length;i++)if(newStacks[i].pos<this.minStackPos)this.minStackPos=newStacks[i].pos;return null;}stopAt(pos){if(this.stoppedAt!=null&&this.stoppedAt<pos)throw new RangeError("Can't move stoppedAt forward");this.stoppedAt=pos;}// Returns an updated version of the given stack, or null if the
// stack can't advance normally. When `split` and `stacks` are
// given, stacks split off by ambiguous operations will be pushed to
// `split`, or added to `stacks` if they move `pos` forward.
advanceStack(stack,stacks,split){let start=stack.pos,{parser}=this;let base=verbose?this.stackID(stack)+" -> ":"";if(this.stoppedAt!=null&&start>this.stoppedAt)return stack.forceReduce()?stack:null;if(this.fragments){let strictCx=stack.curContext&&stack.curContext.tracker.strict,cxHash=strictCx?stack.curContext.hash:0;for(let cached=this.fragments.nodeAt(start);cached;){let match=this.parser.nodeSet.types[cached.type.id]==cached.type?parser.getGoto(stack.state,cached.type.id):-1;if(match>-1&&cached.length&&(!strictCx||(cached.prop(NodeProp.contextHash)||0)==cxHash)){stack.useNode(cached,match);if(verbose)void 0;return true;}if(!(cached instanceof Tree)||cached.children.length==0||cached.positions[0]>0)break;let inner=cached.children[0];if(inner instanceof Tree&&cached.positions[0]==0)cached=inner;else break;}}let defaultReduce=parser.stateSlot(stack.state,4/* ParseState.DefaultReduce */);if(defaultReduce>0){stack.reduce(defaultReduce);if(verbose)void 0;return true;}if(stack.stack.length>=8400/* Rec.CutDepth */){while(stack.stack.length>6000/* Rec.CutTo */&&stack.forceReduce()){}}let actions=this.tokens.getActions(stack);for(let i=0;i<actions.length;){let action=actions[i++],term=actions[i++],end=actions[i++];let last=i==actions.length||!split;let localStack=last?stack:stack.split();let main=this.tokens.mainToken;localStack.apply(action,term,main?main.start:localStack.pos,end);if(verbose)void 0;if(last)return true;else if(localStack.pos>start)stacks.push(localStack);else split.push(localStack);}return false;}// Advance a given stack forward as far as it will go. Returns the
// (possibly updated) stack if it got stuck, or null if it moved
// forward and was given to `pushStackDedup`.
advanceFully(stack,newStacks){let pos=stack.pos;for(;;){if(!this.advanceStack(stack,null,null))return false;if(stack.pos>pos){pushStackDedup(stack,newStacks);return true;}}}runRecovery(stacks,tokens,newStacks){let finished=null,restarted=false;for(let i=0;i<stacks.length;i++){let stack=stacks[i],token=tokens[i<<1],tokenEnd=tokens[(i<<1)+1];let base=verbose?this.stackID(stack)+" -> ":"";if(stack.deadEnd){if(restarted)continue;restarted=true;stack.restart();if(verbose)void 0;let done=this.advanceFully(stack,newStacks);if(done)continue;}let force=stack.split(),forceBase=base;for(let j=0;force.forceReduce()&&j<10/* Rec.ForceReduceLimit */;j++){if(verbose)void 0;let done=this.advanceFully(force,newStacks);if(done)break;if(verbose)forceBase=this.stackID(force)+" -> ";}for(let insert of stack.recoverByInsert(token)){if(verbose)void 0;this.advanceFully(insert,newStacks);}if(this.stream.end>stack.pos){if(tokenEnd==stack.pos){tokenEnd++;token=0/* Term.Err */;}stack.recoverByDelete(token,tokenEnd);if(verbose)void 0;pushStackDedup(stack,newStacks);}else if(!finished||finished.score<stack.score){finished=stack;}}return finished;}// Convert the stack's buffer to a syntax tree.
stackToTree(stack){stack.close();return Tree.build({buffer:StackBufferCursor.create(stack),nodeSet:this.parser.nodeSet,topID:this.topTerm,maxBufferLength:this.parser.bufferLength,reused:this.reused,start:this.ranges[0].from,length:stack.pos-this.ranges[0].from,minRepeatType:this.parser.minRepeatTerm});}stackID(stack){let id=(stackIDs||(stackIDs=new WeakMap())).get(stack);if(!id)stackIDs.set(stack,id=String.fromCodePoint(this.nextStackID++));return id+stack;}}function pushStackDedup(stack,newStacks){for(let i=0;i<newStacks.length;i++){let other=newStacks[i];if(other.pos==stack.pos&&other.sameState(stack)){if(newStacks[i].score<stack.score)newStacks[i]=stack;return;}}newStacks.push(stack);}class Dialect{constructor(source,flags,disabled){this.source=source;this.flags=flags;this.disabled=disabled;}allows(term){return!this.disabled||this.disabled[term]==0;}}const id=x=>x;/**
  Context trackers are used to track stateful context (such as
  indentation in the Python grammar, or parent elements in the XML
  grammar) needed by external tokenizers. You declare them in a
  grammar file as `@context exportName from "module"`.

  Context values should be immutable, and can be updated (replaced)
  on shift or reduce actions.

  The export used in a `@context` declaration should be of this
  type.
  */class ContextTracker{/**
      Define a context tracker.
      */constructor(spec){this.start=spec.start;this.shift=spec.shift||id;this.reduce=spec.reduce||id;this.reuse=spec.reuse||id;this.hash=spec.hash||(()=>0);this.strict=spec.strict!==false;}}/**
  Holds the parse tables for a given grammar, as generated by
  `lezer-generator`, and provides [methods](#common.Parser) to parse
  content with.
  */class LRParser extends Parser{/**
      @internal
      */constructor(spec){super();/**
          @internal
          */this.wrappers=[];if(spec.version!=14/* File.Version */)throw new RangeError(`Parser version (${spec.version}) doesn't match runtime version (${14/* File.Version */})`);let nodeNames=spec.nodeNames.split(" ");this.minRepeatTerm=nodeNames.length;for(let i=0;i<spec.repeatNodeCount;i++)nodeNames.push("");let topTerms=Object.keys(spec.topRules).map(r=>spec.topRules[r][1]);let nodeProps=[];for(let i=0;i<nodeNames.length;i++)nodeProps.push([]);function setProp(nodeID,prop,value){nodeProps[nodeID].push([prop,prop.deserialize(String(value))]);}if(spec.nodeProps)for(let propSpec of spec.nodeProps){let prop=propSpec[0];if(typeof prop=="string")prop=NodeProp[prop];for(let i=1;i<propSpec.length;){let next=propSpec[i++];if(next>=0){setProp(next,prop,propSpec[i++]);}else{let value=propSpec[i+-next];for(let j=-next;j>0;j--)setProp(propSpec[i++],prop,value);i++;}}}this.nodeSet=new NodeSet(nodeNames.map((name,i)=>NodeType.define({name:i>=this.minRepeatTerm?undefined:name,id:i,props:nodeProps[i],top:topTerms.indexOf(i)>-1,error:i==0,skipped:spec.skippedNodes&&spec.skippedNodes.indexOf(i)>-1})));if(spec.propSources)this.nodeSet=this.nodeSet.extend(...spec.propSources);this.strict=false;this.bufferLength=DefaultBufferLength;let tokenArray=decodeArray(spec.tokenData);this.context=spec.context;this.specializerSpecs=spec.specialized||[];this.specialized=new Uint16Array(this.specializerSpecs.length);for(let i=0;i<this.specializerSpecs.length;i++)this.specialized[i]=this.specializerSpecs[i].term;this.specializers=this.specializerSpecs.map(getSpecializer);this.states=decodeArray(spec.states,Uint32Array);this.data=decodeArray(spec.stateData);this.goto=decodeArray(spec.goto);this.maxTerm=spec.maxTerm;this.tokenizers=spec.tokenizers.map(value=>typeof value=="number"?new TokenGroup(tokenArray,value):value);this.topRules=spec.topRules;this.dialects=spec.dialects||{};this.dynamicPrecedences=spec.dynamicPrecedences||null;this.tokenPrecTable=spec.tokenPrec;this.termNames=spec.termNames||null;this.maxNode=this.nodeSet.types.length-1;this.dialect=this.parseDialect();this.top=this.topRules[Object.keys(this.topRules)[0]];}createParse(input,fragments,ranges){let parse=new Parse(this,input,fragments,ranges);for(let w of this.wrappers)parse=w(parse,input,fragments,ranges);return parse;}/**
      Get a goto table entry @internal
      */getGoto(state,term,loose=false){let table=this.goto;if(term>=table[0])return-1;for(let pos=table[term+1];;){let groupTag=table[pos++],last=groupTag&1;let target=table[pos++];if(last&&loose)return target;for(let end=pos+(groupTag>>1);pos<end;pos++)if(table[pos]==state)return target;if(last)return-1;}}/**
      Check if this state has an action for a given terminal @internal
      */hasAction(state,terminal){let data=this.data;for(let set=0;set<2;set++){for(let i=this.stateSlot(state,set?2/* ParseState.Skip */:1/* ParseState.Actions */),next;;i+=3){if((next=data[i])==65535/* Seq.End */){if(data[i+1]==1/* Seq.Next */)next=data[i=pair(data,i+2)];else if(data[i+1]==2/* Seq.Other */)return pair(data,i+2);else break;}if(next==terminal||next==0/* Term.Err */)return pair(data,i+1);}}return 0;}/**
      @internal
      */stateSlot(state,slot){return this.states[state*6/* ParseState.Size */+slot];}/**
      @internal
      */stateFlag(state,flag){return(this.stateSlot(state,0/* ParseState.Flags */)&flag)>0;}/**
      @internal
      */validAction(state,action){return!!this.allActions(state,a=>a==action?true:null);}/**
      @internal
      */allActions(state,action){let deflt=this.stateSlot(state,4/* ParseState.DefaultReduce */);let result=deflt?action(deflt):undefined;for(let i=this.stateSlot(state,1/* ParseState.Actions */);result==null;i+=3){if(this.data[i]==65535/* Seq.End */){if(this.data[i+1]==1/* Seq.Next */)i=pair(this.data,i+2);else break;}result=action(pair(this.data,i+1));}return result;}/**
      Get the states that can follow this one through shift actions or
      goto jumps. @internal
      */nextStates(state){let result=[];for(let i=this.stateSlot(state,1/* ParseState.Actions */);;i+=3){if(this.data[i]==65535/* Seq.End */){if(this.data[i+1]==1/* Seq.Next */)i=pair(this.data,i+2);else break;}if((this.data[i+2]&65536/* Action.ReduceFlag */>>16)==0){let value=this.data[i+1];if(!result.some((v,i)=>i&1&&v==value))result.push(this.data[i],value);}}return result;}/**
      Configure the parser. Returns a new parser instance that has the
      given settings modified. Settings not provided in `config` are
      kept from the original parser.
      */configure(config){// Hideous reflection-based kludge to make it easy to create a
// slightly modified copy of a parser.
let copy=Object.assign(Object.create(LRParser.prototype),this);if(config.props)copy.nodeSet=this.nodeSet.extend(...config.props);if(config.top){let info=this.topRules[config.top];if(!info)throw new RangeError(`Invalid top rule name ${config.top}`);copy.top=info;}if(config.tokenizers)copy.tokenizers=this.tokenizers.map(t=>{let found=config.tokenizers.find(r=>r.from==t);return found?found.to:t;});if(config.specializers){copy.specializers=this.specializers.slice();copy.specializerSpecs=this.specializerSpecs.map((s,i)=>{let found=config.specializers.find(r=>r.from==s.external);if(!found)return s;let spec=Object.assign(Object.assign({},s),{external:found.to});copy.specializers[i]=getSpecializer(spec);return spec;});}if(config.contextTracker)copy.context=config.contextTracker;if(config.dialect)copy.dialect=this.parseDialect(config.dialect);if(config.strict!=null)copy.strict=config.strict;if(config.wrap)copy.wrappers=copy.wrappers.concat(config.wrap);if(config.bufferLength!=null)copy.bufferLength=config.bufferLength;return copy;}/**
      Tells you whether any [parse wrappers](#lr.ParserConfig.wrap)
      are registered for this parser.
      */hasWrappers(){return this.wrappers.length>0;}/**
      Returns the name associated with a given term. This will only
      work for all terms when the parser was generated with the
      `--names` option. By default, only the names of tagged terms are
      stored.
      */getName(term){return this.termNames?this.termNames[term]:String(term<=this.maxNode&&this.nodeSet.types[term].name||term);}/**
      The eof term id is always allocated directly after the node
      types. @internal
      */get eofTerm(){return this.maxNode+1;}/**
      The type of top node produced by the parser.
      */get topNode(){return this.nodeSet.types[this.top[1]];}/**
      @internal
      */dynamicPrecedence(term){let prec=this.dynamicPrecedences;return prec==null?0:prec[term]||0;}/**
      @internal
      */parseDialect(dialect){let values=Object.keys(this.dialects),flags=values.map(()=>false);if(dialect)for(let part of dialect.split(" ")){let id=values.indexOf(part);if(id>=0)flags[id]=true;}let disabled=null;for(let i=0;i<values.length;i++)if(!flags[i]){for(let j=this.dialects[values[i]],id;(id=this.data[j++])!=65535/* Seq.End */;)(disabled||(disabled=new Uint8Array(this.maxTerm+1)))[id]=1;}return new Dialect(dialect,flags,disabled);}/**
      Used by the output of the parser generator. Not available to
      user code. @hide
      */static deserialize(spec){return new LRParser(spec);}}function pair(data,off){return data[off]|data[off+1]<<16;}function findFinished(stacks){let best=null;for(let stack of stacks){let stopped=stack.p.stoppedAt;if((stack.pos==stack.p.stream.end||stopped!=null&&stack.pos>stopped)&&stack.p.parser.stateFlag(stack.state,2/* StateFlag.Accepting */)&&(!best||best.score<stack.score))best=stack;}return best;}function getSpecializer(spec){if(spec.external){let mask=spec.extend?1/* Specialize.Extend */:0/* Specialize.Specialize */;return(value,stack)=>spec.external(value,stack)<<1|mask;}return spec.get;}const twigHighlight=styleTags({"for endfor if elseif else endif set":tags$1.controlKeyword,StartTag:tags$1.meta,CloseTag:tags$1.meta,"{{ }}":tags$1.meta});// This file was generated by lezer-generator. You probably shouldn't edit it.
const spec_Identifier={__proto__:null,if:20,elseif:28,else:32,endif:36,for:42,endfor:46,set:52};const parser$3=LRParser.deserialize({version:14,states:"&`QVOPOOObQQO'#C^OgOPO'#CbOrOPO'#CoOOOO'#Ct'#CtOOOO'#C|'#C|OOOO'#Cw'#CwQVOPOOO}QSO'#CcO!YQQO,58xOOOO'#Cx'#CxOgOPO,58|OOOO,58|,58|O!pQSO'#CkOOOO,59Z,59ZOrOPO,59ZO!wQSO'#CrOOOO-E6u-E6uO#VQQO,58}O#[QQO,59[O#aQQO,59aOOOO1G.d1G.dOOOO-E6v-E6vOOOO1G.h1G.hO#fQQO,59TO#kQQO,59VO#pQQO,59XOOOO1G.u1G.uO#uQQO,59^O#zQQO1G.iO$PQQO1G.vO$UQQO1G.{P!_QSO'#CkO$ZQQO1G.oOOOO1G.q1G.qOOOO1G.s1G.sOOOO1G.x1G.xOOOO7+$T7+$TOOOO7+$b7+$bOOOO7+$g7+$gOOOO7+$Z7+$Z",stateData:"$c~OoOS~ORPOWWO[UO~OSXO~ORPOW]O[YO~ORPOW`O[UO~OYbOecOjdO~OTeO~OYbO^hO`iOecOjdO~ObjO~P!_OYbOecOglOjdO~OSmO~OSnO~OSoO~OSqO~OZrO~OZsO~OZtO~OZuO~OZvO~OZwO~OZxO~OoS~",goto:"#`qPPrPPPrzPPPPP!SP!SP!WPr!^P!fPr!lP!t#OPPP#U]TOQRVZ_]QOQRVZ_TYQZQ[QRgZ]ROQRVZ_Q^RRk_]SOQRVZ_QVOQ_RTaV_QZQRfZWUORV_TYQZ",nodeNames:"⚠ Template Insert {{ DirectiveContent }} IfTag StartIfTag StartTag Identifier if CloseTag Text ElseIfTag elseif ElseTag else EndIfTag endif ForTag StartForTag for EndForTag endfor SetTag SetTag set",maxTerm:32,propSources:[twigHighlight],skippedNodes:[0,9],repeatNodeCount:2,tokenData:"/`VRpOX#VX^(O^p#Vpq(Oqu#Vuv*Sv!c#V!c!}+[!}#T#V#T#o+[#o#p,Z#p#q#V#q#r.W#r#y#V#y#z(O#z$f#V$f$g(O$g#BY#V#BY#BZ(O#BZ$IS#V$IS$I_(O$I_$I|#V$I|$JO(O$JO$JT#V$JT$JU(O$JU$KV#V$KV$KW(O$KW&FU#V&FU&FV(O&FV;'S#V;'S;=`&o<%lO#VR#^X[PSQOu#Vuv#yv#o#V#o#p$k#p#q#V#q#r#y#r;'S#V;'S;=`&o<%lO#VR$OX[PO#o#V#o#p$k#p#q#V#q#r&z#r;'S#V;'S;=`&o<%l~#V~O#V~~&jR$pZSQOu#Vuv%cv#o#V#o#p%x#p#q#V#q#r#y#r;'S#V;'S;=`&o<%l~#V~O#V~~&uQ%fUO#q%x#r;'S%x;'S;=`&d<%l~%x~O%x~~&jQ%}VSQOu%xuv%cv#q%x#q#r%c#r;'S%x;'S;=`&d<%lO%xQ&gP;=`<%l%xQ&oOSQR&rP;=`<%l#VP&zO[PP'PT[PO#o&z#o#p'`#p;'S&z;'S;=`'x<%lO&zP'cVOu&zv#o&z#p;'S&z;'S;=`'x<%l~&z~O&z~~&uP'{P;=`<%l&zV(Xm[PoUSQOX#VX^(O^p#Vpq(Oqu#Vuv#yv#o#V#o#p$k#p#q#V#q#r#y#r#y#V#y#z(O#z$f#V$f$g(O$g#BY#V#BY#BZ(O#BZ$IS#V$IS$I_(O$I_$I|#V$I|$JO(O$JO$JT#V$JT$JU(O$JU$KV#V$KV$KW(O$KW&FU#V&FU&FV(O&FV;'S#V;'S;=`&o<%lO#VR*XX[PO#o#V#o#p$k#p#q#V#q#r*t#r;'S#V;'S;=`&o<%l~#V~O#V~~&jR*{TZQ[PO#o&z#o#p'`#p;'S&z;'S;=`'x<%lO&zV+e[XS[PSQOu#Vuv#yv!c#V!c!}+[!}#T#V#T#o+[#o#p$k#p#q#V#q#r#y#r;'S#V;'S;=`&o<%lO#VR,`ZSQOu#Vuv-Rv#o#V#o#p-j#p#q#V#q#r#y#r;'S#V;'S;=`&o<%l~#V~O#V~~&uR-WUWPO#q%x#r;'S%x;'S;=`&d<%l~%x~O%x~~&jR-qVRPSQOu%xuv%cv#q%x#q#r%c#r;'S%x;'S;=`&d<%lO%xR.]X[PO#o#V#o#p$k#p#q#V#q#r.x#r;'S#V;'S;=`&o<%l~#V~O#V~~&jR/PTTQ[PO#o&z#o#p'`#p;'S&z;'S;=`'x<%lO&z",tokenizers:[0,1,2],topRules:{"Template":[0,1]},specialized:[{term:9,get:value=>spec_Identifier[value]||-1}],tokenPrec:154});// This file was generated by lezer-generator. You probably shouldn't edit it.
const scriptText=54,StartCloseScriptTag=1,styleText=55,StartCloseStyleTag=2,textareaText=56,StartCloseTextareaTag=3,EndTag=4,SelfClosingEndTag=5,StartTag=6,StartScriptTag=7,StartStyleTag=8,StartTextareaTag=9,StartSelfClosingTag=10,StartCloseTag=11,NoMatchStartCloseTag=12,MismatchedStartCloseTag=13,missingCloseTag=57,IncompleteCloseTag=14,commentContent$1=58,Element=20,TagName=22,Attribute=23,AttributeName=24,AttributeValue=26,UnquotedAttributeValue=27,ScriptText=28,StyleText=31,TextareaText=34,OpenTag=36,CloseTag=37,Dialect_noMatch=0,Dialect_selfClosing=1;/* Hand-written tokenizers for HTML. */const selfClosers$1={area:true,base:true,br:true,col:true,command:true,embed:true,frame:true,hr:true,img:true,input:true,keygen:true,link:true,meta:true,param:true,source:true,track:true,wbr:true,menuitem:true};const implicitlyClosed={dd:true,li:true,optgroup:true,option:true,p:true,rp:true,rt:true,tbody:true,td:true,tfoot:true,th:true,tr:true};const closeOnOpen={dd:{dd:true,dt:true},dt:{dd:true,dt:true},li:{li:true},option:{option:true,optgroup:true},optgroup:{optgroup:true},p:{address:true,article:true,aside:true,blockquote:true,dir:true,div:true,dl:true,fieldset:true,footer:true,form:true,h1:true,h2:true,h3:true,h4:true,h5:true,h6:true,header:true,hgroup:true,hr:true,menu:true,nav:true,ol:true,p:true,pre:true,section:true,table:true,ul:true},rp:{rp:true,rt:true},rt:{rp:true,rt:true},tbody:{tbody:true,tfoot:true},td:{td:true,th:true},tfoot:{tbody:true},th:{td:true,th:true},thead:{tbody:true,tfoot:true},tr:{tr:true}};function nameChar(ch){return ch==45||ch==46||ch==58||ch>=65&&ch<=90||ch==95||ch>=97&&ch<=122||ch>=161;}function isSpace(ch){return ch==9||ch==10||ch==13||ch==32;}let cachedName=null,cachedInput=null,cachedPos=0;function tagNameAfter(input,offset){let pos=input.pos+offset;if(cachedPos==pos&&cachedInput==input)return cachedName;let next=input.peek(offset);while(isSpace(next))next=input.peek(++offset);let name="";for(;;){if(!nameChar(next))break;name+=String.fromCharCode(next);next=input.peek(++offset);}// Undefined to signal there's a <? or <!, null for just missing
cachedInput=input;cachedPos=pos;return cachedName=name?name.toLowerCase():next==question||next==bang?undefined:null;}const lessThan=60,greaterThan=62,slash$1=47,question=63,bang=33,dash$1=45;function ElementContext(name,parent){this.name=name;this.parent=parent;this.hash=parent?parent.hash:0;for(let i=0;i<name.length;i++)this.hash+=(this.hash<<4)+name.charCodeAt(i)+(name.charCodeAt(i)<<8);}const startTagTerms=[StartTag,StartSelfClosingTag,StartScriptTag,StartStyleTag,StartTextareaTag];const elementContext=new ContextTracker({start:null,shift(context,term,stack,input){return startTagTerms.indexOf(term)>-1?new ElementContext(tagNameAfter(input,1)||"",context):context;},reduce(context,term){return term==Element&&context?context.parent:context;},reuse(context,node,stack,input){let type=node.type.id;return type==StartTag||type==OpenTag?new ElementContext(tagNameAfter(input,1)||"",context):context;},hash(context){return context?context.hash:0;},strict:false});const tagStart=new ExternalTokenizer((input,stack)=>{if(input.next!=lessThan){// End of file, close any open tags
if(input.next<0&&stack.context)input.acceptToken(missingCloseTag);return;}input.advance();let close=input.next==slash$1;if(close)input.advance();let name=tagNameAfter(input,0);if(name===undefined)return;if(!name)return input.acceptToken(close?IncompleteCloseTag:StartTag);let parent=stack.context?stack.context.name:null;if(close){if(name==parent)return input.acceptToken(StartCloseTag);if(parent&&implicitlyClosed[parent])return input.acceptToken(missingCloseTag,-2);if(stack.dialectEnabled(Dialect_noMatch))return input.acceptToken(NoMatchStartCloseTag);for(let cx=stack.context;cx;cx=cx.parent)if(cx.name==name)return;input.acceptToken(MismatchedStartCloseTag);}else{if(name=="script")return input.acceptToken(StartScriptTag);if(name=="style")return input.acceptToken(StartStyleTag);if(name=="textarea")return input.acceptToken(StartTextareaTag);if(selfClosers$1.hasOwnProperty(name))return input.acceptToken(StartSelfClosingTag);if(parent&&closeOnOpen[parent]&&closeOnOpen[parent][name])input.acceptToken(missingCloseTag,-1);else input.acceptToken(StartTag);}},{contextual:true});const commentContent=new ExternalTokenizer(input=>{for(let dashes=0,i=0;;i++){if(input.next<0){if(i)input.acceptToken(commentContent$1);break;}if(input.next==dash$1){dashes++;}else if(input.next==greaterThan&&dashes>=2){if(i>=3)input.acceptToken(commentContent$1,-2);break;}else{dashes=0;}input.advance();}});function inForeignElement(context){for(;context;context=context.parent)if(context.name=="svg"||context.name=="math")return true;return false;}const endTag=new ExternalTokenizer((input,stack)=>{if(input.next==slash$1&&input.peek(1)==greaterThan){let selfClosing=stack.dialectEnabled(Dialect_selfClosing)||inForeignElement(stack.context);input.acceptToken(selfClosing?SelfClosingEndTag:EndTag,2);}else if(input.next==greaterThan){input.acceptToken(EndTag,1);}});function contentTokenizer(tag,textToken,endToken){let lastState=2+tag.length;return new ExternalTokenizer(input=>{// state means:
// - 0 nothing matched
// - 1 '<' matched
// - 2 '</' + possibly whitespace matched
// - 3-(1+tag.length) part of the tag matched
// - lastState whole tag + possibly whitespace matched
for(let state=0,matchedLen=0,i=0;;i++){if(input.next<0){if(i)input.acceptToken(textToken);break;}if(state==0&&input.next==lessThan||state==1&&input.next==slash$1||state>=2&&state<lastState&&input.next==tag.charCodeAt(state-2)){state++;matchedLen++;}else if((state==2||state==lastState)&&isSpace(input.next)){matchedLen++;}else if(state==lastState&&input.next==greaterThan){if(i>matchedLen)input.acceptToken(textToken,-matchedLen);else input.acceptToken(endToken,-(matchedLen-2));break;}else if((input.next==10/* '\n' */||input.next==13/* '\r' */)&&i){input.acceptToken(textToken,1);break;}else{state=matchedLen=0;}input.advance();}});}const scriptTokens=contentTokenizer("script",scriptText,StartCloseScriptTag);const styleTokens=contentTokenizer("style",styleText,StartCloseStyleTag);const textareaTokens=contentTokenizer("textarea",textareaText,StartCloseTextareaTag);const htmlHighlighting=styleTags({"Text RawText":tags$1.content,"StartTag StartCloseTag SelfClosingEndTag EndTag":tags$1.angleBracket,TagName:tags$1.tagName,"MismatchedCloseTag/TagName":[tags$1.tagName,tags$1.invalid],AttributeName:tags$1.attributeName,"AttributeValue UnquotedAttributeValue":tags$1.attributeValue,Is:tags$1.definitionOperator,"EntityReference CharacterReference":tags$1.character,Comment:tags$1.blockComment,ProcessingInst:tags$1.processingInstruction,DoctypeDecl:tags$1.documentMeta});// This file was generated by lezer-generator. You probably shouldn't edit it.
const parser$2=LRParser.deserialize({version:14,states:",xOVO!rOOO!WQ#tO'#CqO!]Q#tO'#CzO!bQ#tO'#C}O!gQ#tO'#DQO!lQ#tO'#DSO!qOaO'#CpO!|ObO'#CpO#XOdO'#CpO$eO!rO'#CpOOO`'#Cp'#CpO$lO$fO'#DTO$tQ#tO'#DVO$yQ#tO'#DWOOO`'#Dk'#DkOOO`'#DY'#DYQVO!rOOO%OQ&rO,59]O%ZQ&rO,59fO%fQ&rO,59iO%qQ&rO,59lO%|Q&rO,59nOOOa'#D^'#D^O&XOaO'#CxO&dOaO,59[OOOb'#D_'#D_O&lObO'#C{O&wObO,59[OOOd'#D`'#D`O'POdO'#DOO'[OdO,59[OOO`'#Da'#DaO'dO!rO,59[O'kQ#tO'#DROOO`,59[,59[OOOp'#Db'#DbO'pO$fO,59oOOO`,59o,59oO'xQ#|O,59qO'}Q#|O,59rOOO`-E7W-E7WO(SQ&rO'#CsOOQW'#DZ'#DZO(bQ&rO1G.wOOOa1G.w1G.wOOO`1G/Y1G/YO(mQ&rO1G/QOOOb1G/Q1G/QO(xQ&rO1G/TOOOd1G/T1G/TO)TQ&rO1G/WOOO`1G/W1G/WO)`Q&rO1G/YOOOa-E7[-E7[O)kQ#tO'#CyOOO`1G.v1G.vOOOb-E7]-E7]O)pQ#tO'#C|OOOd-E7^-E7^O)uQ#tO'#DPOOO`-E7_-E7_O)zQ#|O,59mOOOp-E7`-E7`OOO`1G/Z1G/ZOOO`1G/]1G/]OOO`1G/^1G/^O*PQ,UO,59_OOQW-E7X-E7XOOOa7+$c7+$cOOO`7+$t7+$tOOOb7+$l7+$lOOOd7+$o7+$oOOO`7+$r7+$rO*[Q#|O,59eO*aQ#|O,59hO*fQ#|O,59kOOO`1G/X1G/XO*kO7[O'#CvO*|OMhO'#CvOOQW1G.y1G.yOOO`1G/P1G/POOO`1G/S1G/SOOO`1G/V1G/VOOOO'#D['#D[O+_O7[O,59bOOQW,59b,59bOOOO'#D]'#D]O+pOMhO,59bOOOO-E7Y-E7YOOQW1G.|1G.|OOOO-E7Z-E7Z",stateData:",]~O!^OS~OUSOVPOWQOXROYTO[]O][O^^O`^Oa^Ob^Oc^Ox^O{_O!dZO~OfaO~OfbO~OfcO~OfdO~OfeO~O!WfOPlP!ZlP~O!XiOQoP!ZoP~O!YlORrP!ZrP~OUSOVPOWQOXROYTOZqO[]O][O^^O`^Oa^Ob^Oc^Ox^O!dZO~O!ZrO~P#dO![sO!euO~OfvO~OfwO~OS|OT}OhyO~OS!POT}OhyO~OS!ROT}OhyO~OS!TOT}OhyO~OS}OT}OhyO~O!WfOPlX!ZlX~OP!WO!Z!XO~O!XiOQoX!ZoX~OQ!ZO!Z!XO~O!YlORrX!ZrX~OR!]O!Z!XO~O!Z!XO~P#dOf!_O~O![sO!e!aO~OS!bO~OS!cO~Oi!dOSgXTgXhgX~OS!fOT!gOhyO~OS!hOT!gOhyO~OS!iOT!gOhyO~OS!jOT!gOhyO~OS!gOT!gOhyO~Of!kO~Of!lO~Of!mO~OS!nO~Ok!qO!`!oO!b!pO~OS!rO~OS!sO~OS!tO~Oa!uOb!uOc!uO!`!wO!a!uO~Oa!xOb!xOc!xO!b!wO!c!xO~Oa!uOb!uOc!uO!`!{O!a!uO~Oa!xOb!xOc!xO!b!{O!c!xO~OT~bac!dx{!d~",goto:"%p!`PPPPPPPPPPPPPPPPPPPP!a!gP!mPP!yP!|#P#S#Y#]#`#f#i#l#r#x!aP!a!aP$O$U$l$r$x%O%U%[%bPPPPPPPP%hX^OX`pXUOX`pezabcde{!O!Q!S!UR!q!dRhUR!XhXVOX`pRkVR!XkXWOX`pRnWR!XnXXOX`pQrXR!XpXYOX`pQ`ORx`Q{aQ!ObQ!QcQ!SdQ!UeZ!e{!O!Q!S!UQ!v!oR!z!vQ!y!pR!|!yQgUR!VgQjVR!YjQmWR![mQpXR!^pQtZR!`tS_O`ToXp",nodeNames:"⚠ StartCloseTag StartCloseTag StartCloseTag EndTag SelfClosingEndTag StartTag StartTag StartTag StartTag StartTag StartCloseTag StartCloseTag StartCloseTag IncompleteCloseTag Document Text EntityReference CharacterReference InvalidEntity Element OpenTag TagName Attribute AttributeName Is AttributeValue UnquotedAttributeValue ScriptText CloseTag OpenTag StyleText CloseTag OpenTag TextareaText CloseTag OpenTag CloseTag SelfClosingTag Comment ProcessingInst MismatchedCloseTag CloseTag DoctypeDecl",maxTerm:67,context:elementContext,nodeProps:[["closedBy",-10,1,2,3,7,8,9,10,11,12,13,"EndTag",6,"EndTag SelfClosingEndTag",-4,21,30,33,36,"CloseTag"],["openedBy",4,"StartTag StartCloseTag",5,"StartTag",-4,29,32,35,37,"OpenTag"],["group",-9,14,17,18,19,20,39,40,41,42,"Entity",16,"Entity TextContent",-3,28,31,34,"TextContent Entity"],["isolate",-11,21,29,30,32,33,35,36,37,38,41,42,"ltr",-3,26,27,39,""]],propSources:[htmlHighlighting],skippedNodes:[0],repeatNodeCount:9,tokenData:"!<p!aR!YOX$qXY,QYZ,QZ[$q[]&X]^,Q^p$qpq,Qqr-_rs3_sv-_vw3}wxHYx}-_}!OH{!O!P-_!P!Q$q!Q![-_![!]Mz!]!^-_!^!_!$S!_!`!;x!`!a&X!a!c-_!c!}Mz!}#R-_#R#SMz#S#T1k#T#oMz#o#s-_#s$f$q$f%W-_%W%oMz%o%p-_%p&aMz&a&b-_&b1pMz1p4U-_4U4dMz4d4e-_4e$ISMz$IS$I`-_$I`$IbMz$Ib$Kh-_$Kh%#tMz%#t&/x-_&/x&EtMz&Et&FV-_&FV;'SMz;'S;:j!#|;:j;=`3X<%l?&r-_?&r?AhMz?Ah?BY$q?BY?MnMz?MnO$q!Z$|c`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr$qrs&}sv$qvw+Pwx(tx!^$q!^!_*V!_!a&X!a#S$q#S#T&X#T;'S$q;'S;=`+z<%lO$q!R&bX`P!a`!cpOr&Xrs&}sv&Xwx(tx!^&X!^!_*V!_;'S&X;'S;=`*y<%lO&Xq'UV`P!cpOv&}wx'kx!^&}!^!_(V!_;'S&};'S;=`(n<%lO&}P'pT`POv'kw!^'k!_;'S'k;'S;=`(P<%lO'kP(SP;=`<%l'kp([S!cpOv(Vx;'S(V;'S;=`(h<%lO(Vp(kP;=`<%l(Vq(qP;=`<%l&}a({W`P!a`Or(trs'ksv(tw!^(t!^!_)e!_;'S(t;'S;=`*P<%lO(t`)jT!a`Or)esv)ew;'S)e;'S;=`)y<%lO)e`)|P;=`<%l)ea*SP;=`<%l(t!Q*^V!a`!cpOr*Vrs(Vsv*Vwx)ex;'S*V;'S;=`*s<%lO*V!Q*vP;=`<%l*V!R*|P;=`<%l&XW+UYkWOX+PZ[+P^p+Pqr+Psw+Px!^+P!a#S+P#T;'S+P;'S;=`+t<%lO+PW+wP;=`<%l+P!Z+}P;=`<%l$q!a,]``P!a`!cp!^^OX&XXY,QYZ,QZ]&X]^,Q^p&Xpq,Qqr&Xrs&}sv&Xwx(tx!^&X!^!_*V!_;'S&X;'S;=`*y<%lO&X!_-ljhS`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr-_rs&}sv-_vw/^wx(tx!P-_!P!Q$q!Q!^-_!^!_*V!_!a&X!a#S-_#S#T1k#T#s-_#s$f$q$f;'S-_;'S;=`3X<%l?Ah-_?Ah?BY$q?BY?Mn-_?MnO$q[/ebhSkWOX+PZ[+P^p+Pqr/^sw/^x!P/^!P!Q+P!Q!^/^!a#S/^#S#T0m#T#s/^#s$f+P$f;'S/^;'S;=`1e<%l?Ah/^?Ah?BY+P?BY?Mn/^?MnO+PS0rXhSqr0msw0mx!P0m!Q!^0m!a#s0m$f;'S0m;'S;=`1_<%l?Ah0m?BY?Mn0mS1bP;=`<%l0m[1hP;=`<%l/^!V1vchS`P!a`!cpOq&Xqr1krs&}sv1kvw0mwx(tx!P1k!P!Q&X!Q!^1k!^!_*V!_!a&X!a#s1k#s$f&X$f;'S1k;'S;=`3R<%l?Ah1k?Ah?BY&X?BY?Mn1k?MnO&X!V3UP;=`<%l1k!_3[P;=`<%l-_!Z3hV!`h`P!cpOv&}wx'kx!^&}!^!_(V!_;'S&};'S;=`(n<%lO&}!_4WihSkWc!ROX5uXZ7SZ[5u[^7S^p5uqr8trs7Sst>]tw8twx7Sx!P8t!P!Q5u!Q!]8t!]!^/^!^!a7S!a#S8t#S#T;{#T#s8t#s$f5u$f;'S8t;'S;=`>V<%l?Ah8t?Ah?BY5u?BY?Mn8t?MnO5u!Z5zbkWOX5uXZ7SZ[5u[^7S^p5uqr5urs7Sst+Ptw5uwx7Sx!]5u!]!^7w!^!a7S!a#S5u#S#T7S#T;'S5u;'S;=`8n<%lO5u!R7VVOp7Sqs7St!]7S!]!^7l!^;'S7S;'S;=`7q<%lO7S!R7qOa!R!R7tP;=`<%l7S!Z8OYkWa!ROX+PZ[+P^p+Pqr+Psw+Px!^+P!a#S+P#T;'S+P;'S;=`+t<%lO+P!Z8qP;=`<%l5u!_8{ihSkWOX5uXZ7SZ[5u[^7S^p5uqr8trs7Sst/^tw8twx7Sx!P8t!P!Q5u!Q!]8t!]!^:j!^!a7S!a#S8t#S#T;{#T#s8t#s$f5u$f;'S8t;'S;=`>V<%l?Ah8t?Ah?BY5u?BY?Mn8t?MnO5u!_:sbhSkWa!ROX+PZ[+P^p+Pqr/^sw/^x!P/^!P!Q+P!Q!^/^!a#S/^#S#T0m#T#s/^#s$f+P$f;'S/^;'S;=`1e<%l?Ah/^?Ah?BY+P?BY?Mn/^?MnO+P!V<QchSOp7Sqr;{rs7Sst0mtw;{wx7Sx!P;{!P!Q7S!Q!];{!]!^=]!^!a7S!a#s;{#s$f7S$f;'S;{;'S;=`>P<%l?Ah;{?Ah?BY7S?BY?Mn;{?MnO7S!V=dXhSa!Rqr0msw0mx!P0m!Q!^0m!a#s0m$f;'S0m;'S;=`1_<%l?Ah0m?BY?Mn0m!V>SP;=`<%l;{!_>YP;=`<%l8t!_>dhhSkWOX@OXZAYZ[@O[^AY^p@OqrBwrsAYswBwwxAYx!PBw!P!Q@O!Q!]Bw!]!^/^!^!aAY!a#SBw#S#TE{#T#sBw#s$f@O$f;'SBw;'S;=`HS<%l?AhBw?Ah?BY@O?BY?MnBw?MnO@O!Z@TakWOX@OXZAYZ[@O[^AY^p@Oqr@OrsAYsw@OwxAYx!]@O!]!^Az!^!aAY!a#S@O#S#TAY#T;'S@O;'S;=`Bq<%lO@O!RA]UOpAYq!]AY!]!^Ao!^;'SAY;'S;=`At<%lOAY!RAtOb!R!RAwP;=`<%lAY!ZBRYkWb!ROX+PZ[+P^p+Pqr+Psw+Px!^+P!a#S+P#T;'S+P;'S;=`+t<%lO+P!ZBtP;=`<%l@O!_COhhSkWOX@OXZAYZ[@O[^AY^p@OqrBwrsAYswBwwxAYx!PBw!P!Q@O!Q!]Bw!]!^Dj!^!aAY!a#SBw#S#TE{#T#sBw#s$f@O$f;'SBw;'S;=`HS<%l?AhBw?Ah?BY@O?BY?MnBw?MnO@O!_DsbhSkWb!ROX+PZ[+P^p+Pqr/^sw/^x!P/^!P!Q+P!Q!^/^!a#S/^#S#T0m#T#s/^#s$f+P$f;'S/^;'S;=`1e<%l?Ah/^?Ah?BY+P?BY?Mn/^?MnO+P!VFQbhSOpAYqrE{rsAYswE{wxAYx!PE{!P!QAY!Q!]E{!]!^GY!^!aAY!a#sE{#s$fAY$f;'SE{;'S;=`G|<%l?AhE{?Ah?BYAY?BY?MnE{?MnOAY!VGaXhSb!Rqr0msw0mx!P0m!Q!^0m!a#s0m$f;'S0m;'S;=`1_<%l?Ah0m?BY?Mn0m!VHPP;=`<%lE{!_HVP;=`<%lBw!ZHcW!bx`P!a`Or(trs'ksv(tw!^(t!^!_)e!_;'S(t;'S;=`*P<%lO(t!aIYlhS`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr-_rs&}sv-_vw/^wx(tx}-_}!OKQ!O!P-_!P!Q$q!Q!^-_!^!_*V!_!a&X!a#S-_#S#T1k#T#s-_#s$f$q$f;'S-_;'S;=`3X<%l?Ah-_?Ah?BY$q?BY?Mn-_?MnO$q!aK_khS`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr-_rs&}sv-_vw/^wx(tx!P-_!P!Q$q!Q!^-_!^!_*V!_!`&X!`!aMS!a#S-_#S#T1k#T#s-_#s$f$q$f;'S-_;'S;=`3X<%l?Ah-_?Ah?BY$q?BY?Mn-_?MnO$q!TM_X`P!a`!cp!eQOr&Xrs&}sv&Xwx(tx!^&X!^!_*V!_;'S&X;'S;=`*y<%lO&X!aNZ!ZhSfQ`PkW!a`!cpOX$qXZ&XZ[$q[^&X^p$qpq&Xqr-_rs&}sv-_vw/^wx(tx}-_}!OMz!O!PMz!P!Q$q!Q![Mz![!]Mz!]!^-_!^!_*V!_!a&X!a!c-_!c!}Mz!}#R-_#R#SMz#S#T1k#T#oMz#o#s-_#s$f$q$f$}-_$}%OMz%O%W-_%W%oMz%o%p-_%p&aMz&a&b-_&b1pMz1p4UMz4U4dMz4d4e-_4e$ISMz$IS$I`-_$I`$IbMz$Ib$Je-_$Je$JgMz$Jg$Kh-_$Kh%#tMz%#t&/x-_&/x&EtMz&Et&FV-_&FV;'SMz;'S;:j!#|;:j;=`3X<%l?&r-_?&r?AhMz?Ah?BY$q?BY?MnMz?MnO$q!a!$PP;=`<%lMz!R!$ZY!a`!cpOq*Vqr!$yrs(Vsv*Vwx)ex!a*V!a!b!4t!b;'S*V;'S;=`*s<%lO*V!R!%Q]!a`!cpOr*Vrs(Vsv*Vwx)ex}*V}!O!%y!O!f*V!f!g!']!g#W*V#W#X!0`#X;'S*V;'S;=`*s<%lO*V!R!&QX!a`!cpOr*Vrs(Vsv*Vwx)ex}*V}!O!&m!O;'S*V;'S;=`*s<%lO*V!R!&vV!a`!cp!dPOr*Vrs(Vsv*Vwx)ex;'S*V;'S;=`*s<%lO*V!R!'dX!a`!cpOr*Vrs(Vsv*Vwx)ex!q*V!q!r!(P!r;'S*V;'S;=`*s<%lO*V!R!(WX!a`!cpOr*Vrs(Vsv*Vwx)ex!e*V!e!f!(s!f;'S*V;'S;=`*s<%lO*V!R!(zX!a`!cpOr*Vrs(Vsv*Vwx)ex!v*V!v!w!)g!w;'S*V;'S;=`*s<%lO*V!R!)nX!a`!cpOr*Vrs(Vsv*Vwx)ex!{*V!{!|!*Z!|;'S*V;'S;=`*s<%lO*V!R!*bX!a`!cpOr*Vrs(Vsv*Vwx)ex!r*V!r!s!*}!s;'S*V;'S;=`*s<%lO*V!R!+UX!a`!cpOr*Vrs(Vsv*Vwx)ex!g*V!g!h!+q!h;'S*V;'S;=`*s<%lO*V!R!+xY!a`!cpOr!+qrs!,hsv!+qvw!-Swx!.[x!`!+q!`!a!/j!a;'S!+q;'S;=`!0Y<%lO!+qq!,mV!cpOv!,hvx!-Sx!`!,h!`!a!-q!a;'S!,h;'S;=`!.U<%lO!,hP!-VTO!`!-S!`!a!-f!a;'S!-S;'S;=`!-k<%lO!-SP!-kO{PP!-nP;=`<%l!-Sq!-xS!cp{POv(Vx;'S(V;'S;=`(h<%lO(Vq!.XP;=`<%l!,ha!.aX!a`Or!.[rs!-Ssv!.[vw!-Sw!`!.[!`!a!.|!a;'S!.[;'S;=`!/d<%lO!.[a!/TT!a`{POr)esv)ew;'S)e;'S;=`)y<%lO)ea!/gP;=`<%l!.[!R!/sV!a`!cp{POr*Vrs(Vsv*Vwx)ex;'S*V;'S;=`*s<%lO*V!R!0]P;=`<%l!+q!R!0gX!a`!cpOr*Vrs(Vsv*Vwx)ex#c*V#c#d!1S#d;'S*V;'S;=`*s<%lO*V!R!1ZX!a`!cpOr*Vrs(Vsv*Vwx)ex#V*V#V#W!1v#W;'S*V;'S;=`*s<%lO*V!R!1}X!a`!cpOr*Vrs(Vsv*Vwx)ex#h*V#h#i!2j#i;'S*V;'S;=`*s<%lO*V!R!2qX!a`!cpOr*Vrs(Vsv*Vwx)ex#m*V#m#n!3^#n;'S*V;'S;=`*s<%lO*V!R!3eX!a`!cpOr*Vrs(Vsv*Vwx)ex#d*V#d#e!4Q#e;'S*V;'S;=`*s<%lO*V!R!4XX!a`!cpOr*Vrs(Vsv*Vwx)ex#X*V#X#Y!+q#Y;'S*V;'S;=`*s<%lO*V!R!4{Y!a`!cpOr!4trs!5ksv!4tvw!6Vwx!8]x!a!4t!a!b!:]!b;'S!4t;'S;=`!;r<%lO!4tq!5pV!cpOv!5kvx!6Vx!a!5k!a!b!7W!b;'S!5k;'S;=`!8V<%lO!5kP!6YTO!a!6V!a!b!6i!b;'S!6V;'S;=`!7Q<%lO!6VP!6lTO!`!6V!`!a!6{!a;'S!6V;'S;=`!7Q<%lO!6VP!7QOxPP!7TP;=`<%l!6Vq!7]V!cpOv!5kvx!6Vx!`!5k!`!a!7r!a;'S!5k;'S;=`!8V<%lO!5kq!7yS!cpxPOv(Vx;'S(V;'S;=`(h<%lO(Vq!8YP;=`<%l!5ka!8bX!a`Or!8]rs!6Vsv!8]vw!6Vw!a!8]!a!b!8}!b;'S!8];'S;=`!:V<%lO!8]a!9SX!a`Or!8]rs!6Vsv!8]vw!6Vw!`!8]!`!a!9o!a;'S!8];'S;=`!:V<%lO!8]a!9vT!a`xPOr)esv)ew;'S)e;'S;=`)y<%lO)ea!:YP;=`<%l!8]!R!:dY!a`!cpOr!4trs!5ksv!4tvw!6Vwx!8]x!`!4t!`!a!;S!a;'S!4t;'S;=`!;r<%lO!4t!R!;]V!a`!cpxPOr*Vrs(Vsv*Vwx)ex;'S*V;'S;=`*s<%lO*V!R!;uP;=`<%l!4t!V!<TXiS`P!a`!cpOr&Xrs&}sv&Xwx(tx!^&X!^!_*V!_;'S&X;'S;=`*y<%lO&X",tokenizers:[scriptTokens,styleTokens,textareaTokens,endTag,tagStart,commentContent,0,1,2,3,4,5],topRules:{"Document":[0,15]},dialects:{noMatch:0,selfClosing:509},tokenPrec:511});function getAttrs(openTag,input){let attrs=Object.create(null);for(let att of openTag.getChildren(Attribute)){let name=att.getChild(AttributeName),value=att.getChild(AttributeValue)||att.getChild(UnquotedAttributeValue);if(name)attrs[input.read(name.from,name.to)]=!value?"":value.type.id==AttributeValue?input.read(value.from+1,value.to-1):input.read(value.from,value.to);}return attrs;}function findTagName(openTag,input){let tagNameNode=openTag.getChild(TagName);return tagNameNode?input.read(tagNameNode.from,tagNameNode.to):" ";}function maybeNest(node,input,tags){let attrs;for(let tag of tags){if(!tag.attrs||tag.attrs(attrs||(attrs=getAttrs(node.node.parent.firstChild,input))))return{parser:tag.parser};}return null;}// tags?: {
//   tag: string,
//   attrs?: ({[attr: string]: string}) => boolean,
//   parser: Parser
// }[]
// attributes?: {
//   name: string,
//   tagName?: string,
//   parser: Parser
// }[]
function configureNesting(tags=[],attributes=[]){let script=[],style=[],textarea=[],other=[];for(let tag of tags){let array=tag.tag=="script"?script:tag.tag=="style"?style:tag.tag=="textarea"?textarea:other;array.push(tag);}let attrs=attributes.length?Object.create(null):null;for(let attr of attributes)(attrs[attr.name]||(attrs[attr.name]=[])).push(attr);return parseMixed((node,input)=>{let id=node.type.id;if(id==ScriptText)return maybeNest(node,input,script);if(id==StyleText)return maybeNest(node,input,style);if(id==TextareaText)return maybeNest(node,input,textarea);if(id==Element&&other.length){let n=node.node,open=n.firstChild,tagName=open&&findTagName(open,input),attrs;if(tagName)for(let tag of other){if(tag.tag==tagName&&(!tag.attrs||tag.attrs(attrs||(attrs=getAttrs(n,input))))){let close=n.lastChild;let to=close.type.id==CloseTag?close.from:n.to;if(to>open.to)return{parser:tag.parser,overlay:[{from:open.to,to}]};}}}if(attrs&&id==Attribute){let n=node.node,nameNode;if(nameNode=n.firstChild){let matches=attrs[input.read(nameNode.from,nameNode.to)];if(matches)for(let attr of matches){if(attr.tagName&&attr.tagName!=findTagName(n.parent,input))continue;let value=n.lastChild;if(value.type.id==AttributeValue){let from=value.from+1;let last=value.lastChild,to=value.to-(last&&last.isError?0:1);if(to>from)return{parser:attr.parser,overlay:[{from,to}]};}else if(value.type.id==UnquotedAttributeValue){return{parser:attr.parser,overlay:[{from:value.from,to:value.to}]};}}}}return null;});}// This file was generated by lezer-generator. You probably shouldn't edit it.
const descendantOp=99,Unit=1,callee=100,identifier$2=101,VariableName=2;/* Hand-written tokenizers for CSS tokens that can't be
     expressed by Lezer's built-in tokenizer. */const space$1=[9,10,11,12,13,32,133,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288];const colon=58,parenL=40,underscore=95,bracketL=91,dash=45,period=46,hash=35,percent=37,ampersand=38,backslash=92,newline$1=10;function isAlpha(ch){return ch>=65&&ch<=90||ch>=97&&ch<=122||ch>=161;}function isDigit(ch){return ch>=48&&ch<=57;}const identifiers=new ExternalTokenizer((input,stack)=>{for(let inside=false,dashes=0,i=0;;i++){let{next}=input;if(isAlpha(next)||next==dash||next==underscore||inside&&isDigit(next)){if(!inside&&(next!=dash||i>0))inside=true;if(dashes===i&&next==dash)dashes++;input.advance();}else if(next==backslash&&input.peek(1)!=newline$1){input.advance();if(input.next>-1)input.advance();inside=true;}else{if(inside)input.acceptToken(next==parenL?callee:dashes==2&&stack.canShift(VariableName)?VariableName:identifier$2);break;}}});const descendant=new ExternalTokenizer(input=>{if(space$1.includes(input.peek(-1))){let{next}=input;if(isAlpha(next)||next==underscore||next==hash||next==period||next==bracketL||next==colon&&isAlpha(input.peek(1))||next==dash||next==ampersand)input.acceptToken(descendantOp);}});const unitToken=new ExternalTokenizer(input=>{if(!space$1.includes(input.peek(-1))){let{next}=input;if(next==percent){input.advance();input.acceptToken(Unit);}if(isAlpha(next)){do{input.advance();}while(isAlpha(input.next)||isDigit(input.next));input.acceptToken(Unit);}}});const cssHighlighting=styleTags({"AtKeyword import charset namespace keyframes media supports":tags$1.definitionKeyword,"from to selector":tags$1.keyword,NamespaceName:tags$1.namespace,KeyframeName:tags$1.labelName,KeyframeRangeName:tags$1.operatorKeyword,TagName:tags$1.tagName,ClassName:tags$1.className,PseudoClassName:tags$1.constant(tags$1.className),IdName:tags$1.labelName,"FeatureName PropertyName":tags$1.propertyName,AttributeName:tags$1.attributeName,NumberLiteral:tags$1.number,KeywordQuery:tags$1.keyword,UnaryQueryOp:tags$1.operatorKeyword,"CallTag ValueName":tags$1.atom,VariableName:tags$1.variableName,Callee:tags$1.operatorKeyword,Unit:tags$1.unit,"UniversalSelector NestingSelector":tags$1.definitionOperator,MatchOp:tags$1.compareOperator,"ChildOp SiblingOp, LogicOp":tags$1.logicOperator,BinOp:tags$1.arithmeticOperator,Important:tags$1.modifier,Comment:tags$1.blockComment,ColorLiteral:tags$1.color,"ParenthesizedContent StringLiteral":tags$1.string,":":tags$1.punctuation,"PseudoOp #":tags$1.derefOperator,"; ,":tags$1.separator,"( )":tags$1.paren,"[ ]":tags$1.squareBracket,"{ }":tags$1.brace});// This file was generated by lezer-generator. You probably shouldn't edit it.
const spec_callee={__proto__:null,lang:32,"nth-child":32,"nth-last-child":32,"nth-of-type":32,"nth-last-of-type":32,dir:32,"host-context":32,url:60,"url-prefix":60,domain:60,regexp:60,selector:138};const spec_AtKeyword={__proto__:null,"@import":118,"@media":142,"@charset":146,"@namespace":150,"@keyframes":156,"@supports":168};const spec_identifier$1={__proto__:null,not:132,only:132};const parser$1=LRParser.deserialize({version:14,states:":^QYQ[OOO#_Q[OOP#fOWOOOOQP'#Cd'#CdOOQP'#Cc'#CcO#kQ[O'#CfO$_QXO'#CaO$fQ[O'#ChO$qQ[O'#DTO$vQ[O'#DWOOQP'#Em'#EmO${QdO'#DgO%jQ[O'#DtO${QdO'#DvO%{Q[O'#DxO&WQ[O'#D{O&`Q[O'#ERO&nQ[O'#ETOOQS'#El'#ElOOQS'#EW'#EWQYQ[OOO&uQXO'#CdO'jQWO'#DcO'oQWO'#EsO'zQ[O'#EsQOQWOOP(UO#tO'#C_POOO)C@[)C@[OOQP'#Cg'#CgOOQP,59Q,59QO#kQ[O,59QO(aQ[O'#E[O({QWO,58{O)TQ[O,59SO$qQ[O,59oO$vQ[O,59rO(aQ[O,59uO(aQ[O,59wO(aQ[O,59xO)`Q[O'#DbOOQS,58{,58{OOQP'#Ck'#CkOOQO'#DR'#DROOQP,59S,59SO)gQWO,59SO)lQWO,59SOOQP'#DV'#DVOOQP,59o,59oOOQO'#DX'#DXO)qQ`O,59rOOQS'#Cp'#CpO${QdO'#CqO)yQvO'#CsO+ZQtO,5:ROOQO'#Cx'#CxO)lQWO'#CwO+oQWO'#CyO+tQ[O'#DOOOQS'#Ep'#EpOOQO'#Dj'#DjO+|Q[O'#DqO,[QWO'#EtO&`Q[O'#DoO,jQWO'#DrOOQO'#Eu'#EuO)OQWO,5:`O,oQpO,5:bOOQS'#Dz'#DzO,wQWO,5:dO,|Q[O,5:dOOQO'#D}'#D}O-UQWO,5:gO-ZQWO,5:mO-cQWO,5:oOOQS-E8U-E8UO${QdO,59}O-kQ[O'#E^O-xQWO,5;_O-xQWO,5;_POOO'#EV'#EVP.TO#tO,58yPOOO,58y,58yOOQP1G.l1G.lO.zQXO,5:vOOQO-E8Y-E8YOOQS1G.g1G.gOOQP1G.n1G.nO)gQWO1G.nO)lQWO1G.nOOQP1G/Z1G/ZO/XQ`O1G/^O/rQXO1G/aO0YQXO1G/cO0pQXO1G/dO1WQWO,59|O1]Q[O'#DSO1dQdO'#CoOOQP1G/^1G/^O${QdO1G/^O1kQpO,59]OOQS,59_,59_O${QdO,59aO1sQWO1G/mOOQS,59c,59cO1xQ!bO,59eOOQS'#DP'#DPOOQS'#EY'#EYO2QQ[O,59jOOQS,59j,59jO2YQWO'#DjO2eQWO,5:VO2jQWO,5:]O&`Q[O,5:XO&`Q[O'#E_O2rQWO,5;`O2}QWO,5:ZO(aQ[O,5:^OOQS1G/z1G/zOOQS1G/|1G/|OOQS1G0O1G0OO3`QWO1G0OO3eQdO'#EOOOQS1G0R1G0ROOQS1G0X1G0XOOQS1G0Z1G0ZO3pQtO1G/iOOQO,5:x,5:xO4WQ[O,5:xOOQO-E8[-E8[O4eQWO1G0yPOOO-E8T-E8TPOOO1G.e1G.eOOQP7+$Y7+$YOOQP7+$x7+$xO${QdO7+$xOOQS1G/h1G/hO4pQXO'#ErO4wQWO,59nO4|QtO'#EXO5tQdO'#EoO6OQWO,59ZO6TQpO7+$xOOQS1G.w1G.wOOQS1G.{1G.{OOQS7+%X7+%XO6]QWO1G/POOQS-E8W-E8WOOQS1G/U1G/UO${QdO1G/qOOQO1G/w1G/wOOQO1G/s1G/sO6bQWO,5:yOOQO-E8]-E8]O6pQXO1G/xOOQS7+%j7+%jO6wQYO'#CsOOQO'#EQ'#EQO7SQ`O'#EPOOQO'#EP'#EPO7_QWO'#E`O7gQdO,5:jOOQS,5:j,5:jO7rQtO'#E]O${QdO'#E]O8sQdO7+%TOOQO7+%T7+%TOOQO1G0d1G0dO9WQpO<<HdO9`QWO,5;^OOQP1G/Y1G/YOOQS-E8V-E8VO${QdO'#EZO9hQWO,5;ZOOQT1G.u1G.uOOQP<<Hd<<HdOOQS7+$k7+$kO9pQdO7+%]OOQO7+%d7+%dOOQO,5:k,5:kO3hQdO'#EaO7_QWO,5:zOOQS,5:z,5:zOOQS-E8^-E8^OOQS1G0U1G0UO9wQtO,5:wOOQS-E8Z-E8ZOOQO<<Ho<<HoOOQPAN>OAN>OO:xQdO,5:uOOQO-E8X-E8XOOQO<<Hw<<HwOOQO,5:{,5:{OOQO-E8_-E8_OOQS1G0f1G0f",stateData:";[~O#ZOS#[QQ~OUYOXYO]VO^VOqXOxWO![aO!]ZO!i[O!k]O!m^O!p_O!v`O#XRO#bTO~OQfOUYOXYO]VO^VOqXOxWO![aO!]ZO!i[O!k]O!m^O!p_O!v`O#XeO#bTO~O#U#gP~P!ZO#[jO~O#XlO~O]qO^qOqsOtoOxrO!OtO!RvO#VuO#bnO~O!TwO~P#pO`}O#WzO#XyO~O#X!OO~O#X!QO~OQ![Ob!TOf![Oh![On!YOq!ZO#W!WO#X!SO#e!UO~Ob!^O!d!`O!g!aO#X!]O!T#hP~Oh!fOn!YO#X!eO~Oh!hO#X!hO~Ob!^O!d!`O!g!aO#X!]O~O!Y#hP~P%jO]WX]!WX^WXqWXtWXxWX!OWX!RWX!TWX#VWX#bWX~O]!mO~O!Y!nO#U#gX!S#gX~O#U#gX!S#gX~P!ZO#]!qO#^!qO#_!sO~OUYOXYO]VO^VOqXOxWO#XRO#bTO~OtoO!TwO~O`!zO#WzO#XyO~O!S#gP~P!ZOb#RO~Ob#SO~Op#TO|#UO~OP#WObgXjgX!YgX!dgX!ggX#XgXagXQgXfgXhgXngXqgXtgX!XgX#UgX#WgX#egXpgX!SgX~Ob!^Oj#XO!d!`O!g!aO#X!]O!Y#hP~Ob#[O~Op#`O#X#]O~Ob!^O!d!`O!g!aO#X#aO~Ot#eO!b#dO!T#hX!Y#hX~Ob#hO~Oj#XO!Y#jO~O!Y#kO~Oh#lOn!YO~O!T#mO~O!TwO!b#dO~O!TwO!Y#pO~O!Y#QX#U#QX!S#QX~P!ZO!Y!nO#U#ga!S#ga~O#]!qO#^!qO#_#wO~O]qO^qOqsOxrO!OtO!RvO#VuO#bnO~Ot#Oa!T#Oaa#Oa~P.`Op#yO|#zO~O]qO^qOqsOxrO#bnO~Ot}i!O}i!R}i!T}i#V}ia}i~P/aOt!Pi!O!Pi!R!Pi!T!Pi#V!Pia!Pi~P/aOt!Qi!O!Qi!R!Qi!T!Qi#V!Qia!Qi~P/aO!S#{O~Oa#fP~P(aOa#cP~P${Oa$SOj#XO~O!Y$UO~Oh$VOo$VO~Op$XO#X#]O~O]!`Xa!^X!b!^X~O]$YO~Oa$ZO!b#dO~Ot#eO!T#ha!Y#ha~O!b#dOt!ca!T!ca!Y!caa!ca~O!Y$`O~O!S$gO#X$bO#e$aO~Oj#XOt$iO!X$kO!Y!Vi#U!Vi!S!Vi~P${O!Y#Qa#U#Qa!S#Qa~P!ZO!Y!nO#U#gi!S#gi~Oa#fX~P#pOa$oO~Oj#XOQ!{Xa!{Xb!{Xf!{Xh!{Xn!{Xq!{Xt!{X#W!{X#X!{X#e!{X~Ot$qOa#cX~P${Oa$sO~Oj#XOp$tO~Oa$uO~O!b#dOt#Ra!T#Ra!Y#Ra~Oa$wO~P.`OP#WOtgX!TgX~O#e$aOt!sX!T!sX~Ot$yO!TwO~O!S$}O#X$bO#e$aO~Oj#XOQ#PXb#PXf#PXh#PXn#PXq#PXt#PX!X#PX!Y#PX#U#PX#W#PX#X#PX#e#PX!S#PX~Ot$iO!X%QO!Y!Vq#U!Vq!S!Vq~P${Oj#XOp%RO~OtoOa#fa~Ot$qOa#ca~Oa%UO~P${Oj#XOQ#Pab#Paf#Pah#Pan#Paq#Pat#Pa!X#Pa!Y#Pa#U#Pa#W#Pa#X#Pa#e#Pa!S#Pa~Oa!}at!}a~P${O#Zo#[#ej!R#e~",goto:"-g#jPPP#kP#nP#w$WP#w$g#wPP$mPPP$s$|$|P%`P$|P$|%z&^PPPP$|&vP&z'Q#wP'W#w'^P#wP#w#wPPP'd'y(WPP#nPP(_(_(i(_P(_P(_(_P#nP#nP#nP(l#nP(o(r(u(|#nP#nP)R)X)h)v)|*S*^*d*n*t*zPPPPPPPPPP+Q+ZP+v+yP,o,r,x-RRkQ_bOPdhw!n#skYOPdhotuvw!n#R#h#skSOPdhotuvw!n#R#h#sQmTR!tnQ{VR!xqQ!x}Q#Z!XR#x!zq![Z]!T!m#S#U#X#q#z$P$Y$i$j$q$v%Sp![Z]!T!m#S#U#X#q#z$P$Y$i$j$q$v%SU$d#m$f$yR$x$cq!XZ]!T!m#S#U#X#q#z$P$Y$i$j$q$v%Sp![Z]!T!m#S#U#X#q#z$P$Y$i$j$q$v%SQ!f^R#l!gT#^!Z#_Q|VR!yqQ!x|R#x!yQ!PWR!{rQ!RXR!|sQxUQ!wpQ#i!cQ#o!jQ#p!kQ${$eR%X$zSgPwQ!phQ#r!nR$l#sZfPhw!n#sa!b[`a!V!^!`#d#eR#b!^R!g^R!i_R#n!iS$e#m$fR%V$yV$c#m$f$yQ!rjR#v!rQdOShPwU!ldh#sR#s!nQ$P#SU$p$P$v%SQ$v$YR%S$qQ#_!ZR$W#_Q$r$PR%T$rQpUS!vp$nR$n#|Q$j#qR%P$jQ!ogS#t!o#uR#u!pQ#f!_R$^#fQ$f#mR$|$fQ$z$eR%W$z_cOPdhw!n#s^UOPdhw!n#sQ!uoQ!}tQ#OuQ#PvQ#|#RR$_#hR$Q#SQ!VZQ!d]Q#V!TQ#q!m[$O#S$P$Y$q$v%SQ$R#UQ$T#XS$h#q$jQ$m#zR%O$iR#}#RQiPR#QwQ!c[Q!kaR#Y!VU!_[a!VQ!j`Q#c!^Q#g!`Q$[#dR$]#e",nodeNames:"⚠ Unit VariableName Comment StyleSheet RuleSet UniversalSelector TagSelector TagName NestingSelector ClassSelector ClassName PseudoClassSelector : :: PseudoClassName PseudoClassName ) ( ArgList ValueName ParenthesizedValue ColorLiteral NumberLiteral StringLiteral BinaryExpression BinOp CallExpression Callee CallLiteral CallTag ParenthesizedContent ] [ LineNames LineName , PseudoClassName ArgList IdSelector # IdName AttributeSelector AttributeName MatchOp ChildSelector ChildOp DescendantSelector SiblingSelector SiblingOp } { Block Declaration PropertyName Important ; ImportStatement AtKeyword import KeywordQuery FeatureQuery FeatureName BinaryQuery LogicOp UnaryQuery UnaryQueryOp ParenthesizedQuery SelectorQuery selector MediaStatement media CharsetStatement charset NamespaceStatement namespace NamespaceName KeyframesStatement keyframes KeyframeName KeyframeList KeyframeSelector KeyframeRangeName SupportsStatement supports AtRule Styles",maxTerm:117,nodeProps:[["isolate",-2,3,24,""],["openedBy",17,"(",32,"[",50,"{"],["closedBy",18,")",33,"]",51,"}"]],propSources:[cssHighlighting],skippedNodes:[0,3,87],repeatNodeCount:11,tokenData:"J^~R!^OX$}X^%u^p$}pq%uqr)Xrs.Rst/utu6duv$}vw7^wx7oxy9^yz9oz{9t{|:_|}?Q}!O?c!O!P@Q!P!Q@i!Q![Ab![!]B]!]!^CX!^!_$}!_!`Cj!`!aC{!a!b$}!b!cDw!c!}$}!}#OFa#O#P$}#P#QFr#Q#R6d#R#T$}#T#UGT#U#c$}#c#dHf#d#o$}#o#pH{#p#q6d#q#rI^#r#sIo#s#y$}#y#z%u#z$f$}$f$g%u$g#BY$}#BY#BZ%u#BZ$IS$}$IS$I_%u$I_$I|$}$I|$JO%u$JO$JT$}$JT$JU%u$JU$KV$}$KV$KW%u$KW&FU$}&FU&FV%u&FV;'S$};'S;=`JW<%lO$}`%QSOy%^z;'S%^;'S;=`%o<%lO%^`%cSo`Oy%^z;'S%^;'S;=`%o<%lO%^`%rP;=`<%l%^~%zh#Z~OX%^X^'f^p%^pq'fqy%^z#y%^#y#z'f#z$f%^$f$g'f$g#BY%^#BY#BZ'f#BZ$IS%^$IS$I_'f$I_$I|%^$I|$JO'f$JO$JT%^$JT$JU'f$JU$KV%^$KV$KW'f$KW&FU%^&FU&FV'f&FV;'S%^;'S;=`%o<%lO%^~'mh#Z~o`OX%^X^'f^p%^pq'fqy%^z#y%^#y#z'f#z$f%^$f$g'f$g#BY%^#BY#BZ'f#BZ$IS%^$IS$I_'f$I_$I|%^$I|$JO'f$JO$JT%^$JT$JU'f$JU$KV%^$KV$KW'f$KW&FU%^&FU&FV'f&FV;'S%^;'S;=`%o<%lO%^l)[UOy%^z#]%^#]#^)n#^;'S%^;'S;=`%o<%lO%^l)sUo`Oy%^z#a%^#a#b*V#b;'S%^;'S;=`%o<%lO%^l*[Uo`Oy%^z#d%^#d#e*n#e;'S%^;'S;=`%o<%lO%^l*sUo`Oy%^z#c%^#c#d+V#d;'S%^;'S;=`%o<%lO%^l+[Uo`Oy%^z#f%^#f#g+n#g;'S%^;'S;=`%o<%lO%^l+sUo`Oy%^z#h%^#h#i,V#i;'S%^;'S;=`%o<%lO%^l,[Uo`Oy%^z#T%^#T#U,n#U;'S%^;'S;=`%o<%lO%^l,sUo`Oy%^z#b%^#b#c-V#c;'S%^;'S;=`%o<%lO%^l-[Uo`Oy%^z#h%^#h#i-n#i;'S%^;'S;=`%o<%lO%^l-uS!X[o`Oy%^z;'S%^;'S;=`%o<%lO%^~.UWOY.RZr.Rrs.ns#O.R#O#P.s#P;'S.R;'S;=`/o<%lO.R~.sOh~~.vRO;'S.R;'S;=`/P;=`O.R~/SXOY.RZr.Rrs.ns#O.R#O#P.s#P;'S.R;'S;=`/o;=`<%l.R<%lO.R~/rP;=`<%l.Rn/zYxQOy%^z!Q%^!Q![0j![!c%^!c!i0j!i#T%^#T#Z0j#Z;'S%^;'S;=`%o<%lO%^l0oYo`Oy%^z!Q%^!Q![1_![!c%^!c!i1_!i#T%^#T#Z1_#Z;'S%^;'S;=`%o<%lO%^l1dYo`Oy%^z!Q%^!Q![2S![!c%^!c!i2S!i#T%^#T#Z2S#Z;'S%^;'S;=`%o<%lO%^l2ZYf[o`Oy%^z!Q%^!Q![2y![!c%^!c!i2y!i#T%^#T#Z2y#Z;'S%^;'S;=`%o<%lO%^l3QYf[o`Oy%^z!Q%^!Q![3p![!c%^!c!i3p!i#T%^#T#Z3p#Z;'S%^;'S;=`%o<%lO%^l3uYo`Oy%^z!Q%^!Q![4e![!c%^!c!i4e!i#T%^#T#Z4e#Z;'S%^;'S;=`%o<%lO%^l4lYf[o`Oy%^z!Q%^!Q![5[![!c%^!c!i5[!i#T%^#T#Z5[#Z;'S%^;'S;=`%o<%lO%^l5aYo`Oy%^z!Q%^!Q![6P![!c%^!c!i6P!i#T%^#T#Z6P#Z;'S%^;'S;=`%o<%lO%^l6WSf[o`Oy%^z;'S%^;'S;=`%o<%lO%^d6gUOy%^z!_%^!_!`6y!`;'S%^;'S;=`%o<%lO%^d7QS|So`Oy%^z;'S%^;'S;=`%o<%lO%^b7cSXQOy%^z;'S%^;'S;=`%o<%lO%^~7rWOY7oZw7owx.nx#O7o#O#P8[#P;'S7o;'S;=`9W<%lO7o~8_RO;'S7o;'S;=`8h;=`O7o~8kXOY7oZw7owx.nx#O7o#O#P8[#P;'S7o;'S;=`9W;=`<%l7o<%lO7o~9ZP;=`<%l7on9cSb^Oy%^z;'S%^;'S;=`%o<%lO%^~9tOa~n9{UUQjWOy%^z!_%^!_!`6y!`;'S%^;'S;=`%o<%lO%^n:fWjW!RQOy%^z!O%^!O!P;O!P!Q%^!Q![>T![;'S%^;'S;=`%o<%lO%^l;TUo`Oy%^z!Q%^!Q![;g![;'S%^;'S;=`%o<%lO%^l;nYo`#e[Oy%^z!Q%^!Q![;g![!g%^!g!h<^!h#X%^#X#Y<^#Y;'S%^;'S;=`%o<%lO%^l<cYo`Oy%^z{%^{|=R|}%^}!O=R!O!Q%^!Q![=j![;'S%^;'S;=`%o<%lO%^l=WUo`Oy%^z!Q%^!Q![=j![;'S%^;'S;=`%o<%lO%^l=qUo`#e[Oy%^z!Q%^!Q![=j![;'S%^;'S;=`%o<%lO%^l>[[o`#e[Oy%^z!O%^!O!P;g!P!Q%^!Q![>T![!g%^!g!h<^!h#X%^#X#Y<^#Y;'S%^;'S;=`%o<%lO%^n?VSt^Oy%^z;'S%^;'S;=`%o<%lO%^l?hWjWOy%^z!O%^!O!P;O!P!Q%^!Q![>T![;'S%^;'S;=`%o<%lO%^n@VU#bQOy%^z!Q%^!Q![;g![;'S%^;'S;=`%o<%lO%^~@nTjWOy%^z{@}{;'S%^;'S;=`%o<%lO%^~AUSo`#[~Oy%^z;'S%^;'S;=`%o<%lO%^lAg[#e[Oy%^z!O%^!O!P;g!P!Q%^!Q![>T![!g%^!g!h<^!h#X%^#X#Y<^#Y;'S%^;'S;=`%o<%lO%^bBbU]QOy%^z![%^![!]Bt!];'S%^;'S;=`%o<%lO%^bB{S^Qo`Oy%^z;'S%^;'S;=`%o<%lO%^nC^S!Y^Oy%^z;'S%^;'S;=`%o<%lO%^dCoS|SOy%^z;'S%^;'S;=`%o<%lO%^bDQU!OQOy%^z!`%^!`!aDd!a;'S%^;'S;=`%o<%lO%^bDkS!OQo`Oy%^z;'S%^;'S;=`%o<%lO%^bDzWOy%^z!c%^!c!}Ed!}#T%^#T#oEd#o;'S%^;'S;=`%o<%lO%^bEk[![Qo`Oy%^z}%^}!OEd!O!Q%^!Q![Ed![!c%^!c!}Ed!}#T%^#T#oEd#o;'S%^;'S;=`%o<%lO%^nFfSq^Oy%^z;'S%^;'S;=`%o<%lO%^nFwSp^Oy%^z;'S%^;'S;=`%o<%lO%^bGWUOy%^z#b%^#b#cGj#c;'S%^;'S;=`%o<%lO%^bGoUo`Oy%^z#W%^#W#XHR#X;'S%^;'S;=`%o<%lO%^bHYS!bQo`Oy%^z;'S%^;'S;=`%o<%lO%^bHiUOy%^z#f%^#f#gHR#g;'S%^;'S;=`%o<%lO%^fIQS!TUOy%^z;'S%^;'S;=`%o<%lO%^nIcS!S^Oy%^z;'S%^;'S;=`%o<%lO%^fItU!RQOy%^z!_%^!_!`6y!`;'S%^;'S;=`%o<%lO%^`JZP;=`<%l$}",tokenizers:[descendant,unitToken,identifiers,1,2,3,4,new LocalTokenGroup("m~RRYZ[z{a~~g~aO#^~~dP!P!Qg~lO#_~~",28,105)],topRules:{"StyleSheet":[0,4],"Styles":[1,86]},specialized:[{term:100,get:value=>spec_callee[value]||-1},{term:58,get:value=>spec_AtKeyword[value]||-1},{term:101,get:value=>spec_identifier$1[value]||-1}],tokenPrec:1200});let _properties=null;function properties(){if(!_properties&&typeof document=="object"&&document.body){let{style}=document.body,names=[],seen=new Set();for(let prop in style)if(prop!="cssText"&&prop!="cssFloat"){if(typeof style[prop]=="string"){if(/[A-Z]/.test(prop))prop=prop.replace(/[A-Z]/g,ch=>"-"+ch.toLowerCase());if(!seen.has(prop)){names.push(prop);seen.add(prop);}}}_properties=names.sort().map(name=>({type:"property",label:name}));}return _properties||[];}const pseudoClasses=/*@__PURE__*/["active","after","any-link","autofill","backdrop","before","checked","cue","default","defined","disabled","empty","enabled","file-selector-button","first","first-child","first-letter","first-line","first-of-type","focus","focus-visible","focus-within","fullscreen","has","host","host-context","hover","in-range","indeterminate","invalid","is","lang","last-child","last-of-type","left","link","marker","modal","not","nth-child","nth-last-child","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","part","placeholder","placeholder-shown","read-only","read-write","required","right","root","scope","selection","slotted","target","target-text","valid","visited","where"].map(name=>({type:"class",label:name}));const values=/*@__PURE__*/["above","absolute","activeborder","additive","activecaption","after-white-space","ahead","alias","all","all-scroll","alphabetic","alternate","always","antialiased","appworkspace","asterisks","attr","auto","auto-flow","avoid","avoid-column","avoid-page","avoid-region","axis-pan","background","backwards","baseline","below","bidi-override","blink","block","block-axis","bold","bolder","border","border-box","both","bottom","break","break-all","break-word","bullets","button","button-bevel","buttonface","buttonhighlight","buttonshadow","buttontext","calc","capitalize","caps-lock-indicator","caption","captiontext","caret","cell","center","checkbox","circle","cjk-decimal","clear","clip","close-quote","col-resize","collapse","color","color-burn","color-dodge","column","column-reverse","compact","condensed","contain","content","contents","content-box","context-menu","continuous","copy","counter","counters","cover","crop","cross","crosshair","currentcolor","cursive","cyclic","darken","dashed","decimal","decimal-leading-zero","default","default-button","dense","destination-atop","destination-in","destination-out","destination-over","difference","disc","discard","disclosure-closed","disclosure-open","document","dot-dash","dot-dot-dash","dotted","double","down","e-resize","ease","ease-in","ease-in-out","ease-out","element","ellipse","ellipsis","embed","end","ethiopic-abegede-gez","ethiopic-halehame-aa-er","ethiopic-halehame-gez","ew-resize","exclusion","expanded","extends","extra-condensed","extra-expanded","fantasy","fast","fill","fill-box","fixed","flat","flex","flex-end","flex-start","footnotes","forwards","from","geometricPrecision","graytext","grid","groove","hand","hard-light","help","hidden","hide","higher","highlight","highlighttext","horizontal","hsl","hsla","hue","icon","ignore","inactiveborder","inactivecaption","inactivecaptiontext","infinite","infobackground","infotext","inherit","initial","inline","inline-axis","inline-block","inline-flex","inline-grid","inline-table","inset","inside","intrinsic","invert","italic","justify","keep-all","landscape","large","larger","left","level","lighter","lighten","line-through","linear","linear-gradient","lines","list-item","listbox","listitem","local","logical","loud","lower","lower-hexadecimal","lower-latin","lower-norwegian","lowercase","ltr","luminosity","manipulation","match","matrix","matrix3d","medium","menu","menutext","message-box","middle","min-intrinsic","mix","monospace","move","multiple","multiple_mask_images","multiply","n-resize","narrower","ne-resize","nesw-resize","no-close-quote","no-drop","no-open-quote","no-repeat","none","normal","not-allowed","nowrap","ns-resize","numbers","numeric","nw-resize","nwse-resize","oblique","opacity","open-quote","optimizeLegibility","optimizeSpeed","outset","outside","outside-shape","overlay","overline","padding","padding-box","painted","page","paused","perspective","pinch-zoom","plus-darker","plus-lighter","pointer","polygon","portrait","pre","pre-line","pre-wrap","preserve-3d","progress","push-button","radial-gradient","radio","read-only","read-write","read-write-plaintext-only","rectangle","region","relative","repeat","repeating-linear-gradient","repeating-radial-gradient","repeat-x","repeat-y","reset","reverse","rgb","rgba","ridge","right","rotate","rotate3d","rotateX","rotateY","rotateZ","round","row","row-resize","row-reverse","rtl","run-in","running","s-resize","sans-serif","saturation","scale","scale3d","scaleX","scaleY","scaleZ","screen","scroll","scrollbar","scroll-position","se-resize","self-start","self-end","semi-condensed","semi-expanded","separate","serif","show","single","skew","skewX","skewY","skip-white-space","slide","slider-horizontal","slider-vertical","sliderthumb-horizontal","sliderthumb-vertical","slow","small","small-caps","small-caption","smaller","soft-light","solid","source-atop","source-in","source-out","source-over","space","space-around","space-between","space-evenly","spell-out","square","start","static","status-bar","stretch","stroke","stroke-box","sub","subpixel-antialiased","svg_masks","super","sw-resize","symbolic","symbols","system-ui","table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row","table-row-group","text","text-bottom","text-top","textarea","textfield","thick","thin","threeddarkshadow","threedface","threedhighlight","threedlightshadow","threedshadow","to","top","transform","translate","translate3d","translateX","translateY","translateZ","transparent","ultra-condensed","ultra-expanded","underline","unidirectional-pan","unset","up","upper-latin","uppercase","url","var","vertical","vertical-text","view-box","visible","visibleFill","visiblePainted","visibleStroke","visual","w-resize","wait","wave","wider","window","windowframe","windowtext","words","wrap","wrap-reverse","x-large","x-small","xor","xx-large","xx-small"].map(name=>({type:"keyword",label:name})).concat(/*@__PURE__*/["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","grey","green","greenyellow","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"].map(name=>({type:"constant",label:name})));const tags=/*@__PURE__*/["a","abbr","address","article","aside","b","bdi","bdo","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","dd","del","details","dfn","dialog","div","dl","dt","em","figcaption","figure","footer","form","header","hgroup","h1","h2","h3","h4","h5","h6","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","main","meter","nav","ol","output","p","pre","ruby","section","select","small","source","span","strong","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","tr","u","ul"].map(name=>({type:"type",label:name}));const identifier$1=/^(\w[\w-]*|-\w[\w-]*|)$/,variable=/^-(-[\w-]*)?$/;function isVarArg(node,doc){var _a;if(node.name=="("||node.type.isError)node=node.parent||node;if(node.name!="ArgList")return false;let callee=(_a=node.parent)===null||_a===void 0?void 0:_a.firstChild;if((callee===null||callee===void 0?void 0:callee.name)!="Callee")return false;return doc.sliceString(callee.from,callee.to)=="var";}const VariablesByNode=/*@__PURE__*/new NodeWeakMap();const declSelector=["Declaration"];function astTop(node){for(let cur=node;;){if(cur.type.isTop)return cur;if(!(cur=cur.parent))return node;}}function variableNames(doc,node,isVariable){if(node.to-node.from>4096){let known=VariablesByNode.get(node);if(known)return known;let result=[],seen=new Set(),cursor=node.cursor(IterMode.IncludeAnonymous);if(cursor.firstChild())do{for(let option of variableNames(doc,cursor.node,isVariable))if(!seen.has(option.label)){seen.add(option.label);result.push(option);}}while(cursor.nextSibling());VariablesByNode.set(node,result);return result;}else{let result=[],seen=new Set();node.cursor().iterate(node=>{var _a;if(isVariable(node)&&node.matchContext(declSelector)&&((_a=node.node.nextSibling)===null||_a===void 0?void 0:_a.name)==":"){let name=doc.sliceString(node.from,node.to);if(!seen.has(name)){seen.add(name);result.push({label:name,type:"variable"});}}});return result;}}/**
  Create a completion source for a CSS dialect, providing a
  predicate for determining what kind of syntax node can act as a
  completable variable. This is used by language modes like Sass and
  Less to reuse this package's completion logic.
  */const defineCSSCompletionSource=isVariable=>context=>{let{state,pos}=context,node=syntaxTree(state).resolveInner(pos,-1);let isDash=node.type.isError&&node.from==node.to-1&&state.doc.sliceString(node.from,node.to)=="-";if(node.name=="PropertyName"||(isDash||node.name=="TagName")&&/^(Block|Styles)$/.test(node.resolve(node.to).name))return{from:node.from,options:properties(),validFor:identifier$1};if(node.name=="ValueName")return{from:node.from,options:values,validFor:identifier$1};if(node.name=="PseudoClassName")return{from:node.from,options:pseudoClasses,validFor:identifier$1};if(isVariable(node)||(context.explicit||isDash)&&isVarArg(node,state.doc))return{from:isVariable(node)||isDash?node.from:pos,options:variableNames(state.doc,astTop(node),isVariable),validFor:variable};if(node.name=="TagName"){for(let{parent}=node;parent;parent=parent.parent)if(parent.name=="Block")return{from:node.from,options:properties(),validFor:identifier$1};return{from:node.from,options:tags,validFor:identifier$1};}if(!context.explicit)return null;let above=node.resolve(pos),before=above.childBefore(pos);if(before&&before.name==":"&&above.name=="PseudoClassSelector")return{from:pos,options:pseudoClasses,validFor:identifier$1};if(before&&before.name==":"&&above.name=="Declaration"||above.name=="ArgList")return{from:pos,options:values,validFor:identifier$1};if(above.name=="Block"||above.name=="Styles")return{from:pos,options:properties(),validFor:identifier$1};return null;};/**
  CSS property, variable, and value keyword completion source.
  */const cssCompletionSource=/*@__PURE__*/defineCSSCompletionSource(n=>n.name=="VariableName");/**
  A language provider based on the [Lezer CSS
  parser](https://github.com/lezer-parser/css), extended with
  highlighting and indentation information.
  */const cssLanguage=/*@__PURE__*/LRLanguage.define({name:"css",parser:/*@__PURE__*/parser$1.configure({props:[/*@__PURE__*/indentNodeProp.add({Declaration:/*@__PURE__*/continuedIndent()}),/*@__PURE__*/foldNodeProp.add({"Block KeyframeList":foldInside})]}),languageData:{commentTokens:{block:{open:"/*",close:"*/"}},indentOnInput:/^\s*\}$/,wordChars:"-"}});/**
  Language support for CSS.
  */function css(){return new LanguageSupport(cssLanguage,cssLanguage.data.of({autocomplete:cssCompletionSource}));}// This file was generated by lezer-generator. You probably shouldn't edit it.
const noSemi=309,incdec=1,incdecPrefix=2,JSXStartTag=3,insertSemi=310,spaces=312,newline=313,LineComment=4,BlockComment=5,Dialect_jsx=0;/* Hand-written tokenizers for JavaScript tokens that can't be
     expressed by lezer's built-in tokenizer. */const space=[9,10,11,12,13,32,133,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288];const braceR=125,semicolon=59,slash=47,star=42,plus=43,minus=45,lt=60,comma=44;const trackNewline=new ContextTracker({start:false,shift(context,term){return term==LineComment||term==BlockComment||term==spaces?context:term==newline;},strict:false});const insertSemicolon=new ExternalTokenizer((input,stack)=>{let{next}=input;if(next==braceR||next==-1||stack.context)input.acceptToken(insertSemi);},{contextual:true,fallback:true});const noSemicolon=new ExternalTokenizer((input,stack)=>{let{next}=input,after;if(space.indexOf(next)>-1)return;if(next==slash&&((after=input.peek(1))==slash||after==star))return;if(next!=braceR&&next!=semicolon&&next!=-1&&!stack.context)input.acceptToken(noSemi);},{contextual:true});const incdecToken=new ExternalTokenizer((input,stack)=>{let{next}=input;if(next==plus||next==minus){input.advance();if(next==input.next){input.advance();let mayPostfix=!stack.context&&stack.canShift(incdec);input.acceptToken(mayPostfix?incdec:incdecPrefix);}}},{contextual:true});function identifierChar(ch,start){return ch>=65&&ch<=90||ch>=97&&ch<=122||ch==95||ch>=192||!start&&ch>=48&&ch<=57;}const jsx=new ExternalTokenizer((input,stack)=>{if(input.next!=lt||!stack.dialectEnabled(Dialect_jsx))return;input.advance();if(input.next==slash)return;// Scan for an identifier followed by a comma or 'extends', don't
// treat this as a start tag if present.
let back=0;while(space.indexOf(input.next)>-1){input.advance();back++;}if(identifierChar(input.next,true)){input.advance();back++;while(identifierChar(input.next,false)){input.advance();back++;}while(space.indexOf(input.next)>-1){input.advance();back++;}if(input.next==comma)return;for(let i=0;;i++){if(i==7){if(!identifierChar(input.next,true))return;break;}if(input.next!="extends".charCodeAt(i))break;input.advance();back++;}}input.acceptToken(JSXStartTag,-back);});const jsHighlight=styleTags({"get set async static":tags$1.modifier,"for while do if else switch try catch finally return throw break continue default case":tags$1.controlKeyword,"in of await yield void typeof delete instanceof":tags$1.operatorKeyword,"let var const using function class extends":tags$1.definitionKeyword,"import export from":tags$1.moduleKeyword,"with debugger as new":tags$1.keyword,TemplateString:tags$1.special(tags$1.string),super:tags$1.atom,BooleanLiteral:tags$1.bool,this:tags$1.self,null:tags$1.null,Star:tags$1.modifier,VariableName:tags$1.variableName,"CallExpression/VariableName TaggedTemplateExpression/VariableName":tags$1.function(tags$1.variableName),VariableDefinition:tags$1.definition(tags$1.variableName),Label:tags$1.labelName,PropertyName:tags$1.propertyName,PrivatePropertyName:tags$1.special(tags$1.propertyName),"CallExpression/MemberExpression/PropertyName":tags$1.function(tags$1.propertyName),"FunctionDeclaration/VariableDefinition":tags$1.function(tags$1.definition(tags$1.variableName)),"ClassDeclaration/VariableDefinition":tags$1.definition(tags$1.className),PropertyDefinition:tags$1.definition(tags$1.propertyName),PrivatePropertyDefinition:tags$1.definition(tags$1.special(tags$1.propertyName)),UpdateOp:tags$1.updateOperator,"LineComment Hashbang":tags$1.lineComment,BlockComment:tags$1.blockComment,Number:tags$1.number,String:tags$1.string,Escape:tags$1.escape,ArithOp:tags$1.arithmeticOperator,LogicOp:tags$1.logicOperator,BitOp:tags$1.bitwiseOperator,CompareOp:tags$1.compareOperator,RegExp:tags$1.regexp,Equals:tags$1.definitionOperator,Arrow:tags$1.function(tags$1.punctuation),": Spread":tags$1.punctuation,"( )":tags$1.paren,"[ ]":tags$1.squareBracket,"{ }":tags$1.brace,"InterpolationStart InterpolationEnd":tags$1.special(tags$1.brace),".":tags$1.derefOperator,", ;":tags$1.separator,"@":tags$1.meta,TypeName:tags$1.typeName,TypeDefinition:tags$1.definition(tags$1.typeName),"type enum interface implements namespace module declare":tags$1.definitionKeyword,"abstract global Privacy readonly override":tags$1.modifier,"is keyof unique infer":tags$1.operatorKeyword,JSXAttributeValue:tags$1.attributeValue,JSXText:tags$1.content,"JSXStartTag JSXStartCloseTag JSXSelfCloseEndTag JSXEndTag":tags$1.angleBracket,"JSXIdentifier JSXNameSpacedName":tags$1.tagName,"JSXAttribute/JSXIdentifier JSXAttribute/JSXNameSpacedName":tags$1.attributeName,"JSXBuiltin/JSXIdentifier":tags$1.standard(tags$1.tagName)});// This file was generated by lezer-generator. You probably shouldn't edit it.
const spec_identifier={__proto__:null,export:18,as:23,from:31,default:34,async:39,function:40,extends:52,this:56,true:64,false:64,null:76,void:80,typeof:84,super:102,new:136,delete:152,yield:161,await:165,class:170,public:227,private:227,protected:227,readonly:229,instanceof:248,satisfies:251,in:252,const:254,import:286,keyof:339,unique:343,infer:349,is:385,abstract:405,implements:407,type:409,let:412,var:414,using:417,interface:423,enum:427,namespace:433,module:435,declare:439,global:443,for:462,of:471,while:474,with:478,do:482,if:486,else:488,switch:492,case:498,try:504,catch:508,finally:512,return:516,throw:520,break:524,continue:528,debugger:532};const spec_word={__proto__:null,async:123,get:125,set:127,declare:187,public:189,private:189,protected:189,static:191,abstract:193,override:195,readonly:201,accessor:203,new:389};const spec_LessThan={__proto__:null,"<":143};const parser=LRParser.deserialize({version:14,states:"$<UO%TQ^OOO%[Q^OOO'_Q`OOP(lOWOOO*zQ08SO'#ChO+RO!bO'#CiO+aO#tO'#CiO+oO?MpO'#D^O.QQ^O'#DdO.bQ^O'#DoO%[Q^O'#DyO0fQ^O'#EROOQ07b'#EZ'#EZO1PQWO'#EWOOQO'#El'#ElOOQO'#Ie'#IeO1XQWO'#GmO1dQWO'#EkO1iQWO'#EkO3kQ08SO'#JiO6[Q08SO'#JjO6xQWO'#FZO6}Q&jO'#FqOOQ07b'#Fc'#FcO7YO,YO'#FcO7hQ7[O'#FxO9UQWO'#FwOOQ07b'#Jj'#JjOOQ07`'#Ji'#JiO9ZQWO'#GqOOQU'#KU'#KUO9fQWO'#IRO9kQ07hO'#ISOOQU'#JW'#JWOOQU'#IW'#IWQ`Q^OOO`Q^OOO%[Q^O'#DqO9sQ^O'#D}O9zQ^O'#EPO9aQWO'#GmO:RQ7[O'#CnO:aQWO'#EjO:lQWO'#EuO:qQ7[O'#FbO;`QWO'#GmOOQO'#KV'#KVO;eQWO'#KVO;sQWO'#GuO;sQWO'#GvO;sQWO'#GxO9aQWO'#G{O<jQWO'#HOO>RQWO'#CdO>cQWO'#H[O>kQWO'#HbO>kQWO'#HdO`Q^O'#HfO>kQWO'#HhO>kQWO'#HkO>pQWO'#HqO>uQ07iO'#HwO%[Q^O'#HyO?QQ07iO'#H{O?]Q07iO'#H}O9kQ07hO'#IPO?hQ08SO'#ChO@jQ`O'#DiQOQWOOO%[Q^O'#EPOAQQWO'#ESO:RQ7[O'#EjOA]QWO'#EjOAhQpO'#FbOOQU'#Cf'#CfOOQ07`'#Dn'#DnOOQ07`'#Jm'#JmO%[Q^O'#JmOOQO'#Jq'#JqOOQO'#Ib'#IbOBhQ`O'#EcOOQ07`'#Eb'#EbOCdQ07pO'#EcOCnQ`O'#EVOOQO'#Jp'#JpODSQ`O'#JqOEaQ`O'#EVOCnQ`O'#EcPEnO!0LbO'#CaPOOO)CDu)CDuOOOO'#IX'#IXOEyO!bO,59TOOQ07b,59T,59TOOOO'#IY'#IYOFXO#tO,59TO%[Q^O'#D`OOOO'#I['#I[OFgO?MpO,59xOOQ07b,59x,59xOFuQ^O'#I]OGYQWO'#JkOI[QrO'#JkO+}Q^O'#JkOIcQWO,5:OOIyQWO'#ElOJWQWO'#JyOJcQWO'#JxOJcQWO'#JxOJkQWO,5;YOJpQWO'#JwOOQ07f,5:Z,5:ZOJwQ^O,5:ZOLxQ08SO,5:eOMiQWO,5:mONSQ07hO'#JvONZQWO'#JuO9ZQWO'#JuONoQWO'#JuONwQWO,5;XON|QWO'#JuO!#UQrO'#JjOOQ07b'#Ch'#ChO%[Q^O'#ERO!#tQpO,5:rOOQO'#Jr'#JrOOQO-E<c-E<cO9aQWO,5=XO!$[QWO,5=XO!$aQ^O,5;VO!&dQ7[O'#EgO!'}QWO,5;VO!)mQ7[O'#DsO!)tQ^O'#DxO!*OQ`O,5;`O!*WQ`O,5;`O%[Q^O,5;`OOQU'#FR'#FROOQU'#FT'#FTO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aO%[Q^O,5;aOOQU'#FX'#FXO!*fQ^O,5;rOOQ07b,5;w,5;wOOQ07b,5;x,5;xO!,iQWO,5;xOOQ07b,5;y,5;yO%[Q^O'#IiO!,qQ07hO,5<eO!&dQ7[O,5;aO!-`Q7[O,5;aO%[Q^O,5;uO!-gQ&jO'#FgO!.dQ&jO'#J}O!.OQ&jO'#J}O!.kQ&jO'#J}OOQO'#J}'#J}O!/PQ&jO,5<POOOS,5<],5<]O!/bQ^O'#FsOOOS'#Ih'#IhO7YO,YO,5;}O!/iQ&jO'#FuOOQ07b,5;},5;}O!0YQMhO'#CuOOQ07b'#Cy'#CyO!0mQWO'#CyO!0rO?MpO'#C}O!1`Q7[O,5<bO!1gQWO,5<dO!3SQ!LQO'#GSO!3aQWO'#GTO!3fQWO'#GTO!3kQ!LQO'#GXO!4jQ`O'#G]OOQO'#Gh'#GhO!(SQ7[O'#GgOOQO'#Gj'#GjO!(SQ7[O'#GiO!5]QMhO'#JdOOQ07b'#Jd'#JdO!5gQWO'#JcO!5uQWO'#JbO!5}QWO'#CtOOQ07b'#Cw'#CwOOQ07b'#DR'#DROOQ07b'#DT'#DTO1SQWO'#DVO!(SQ7[O'#FzO!(SQ7[O'#F|O!6VQWO'#GOO!6[QWO'#GPO!3fQWO'#GVO!(SQ7[O'#G[O!6aQWO'#EmO!7OQWO,5<cOOQ07`'#Cq'#CqO!7WQWO'#EnO!8QQ`O'#EoOOQ07`'#Jw'#JwO!8XQ07hO'#KWO9kQ07hO,5=]O`Q^O,5>mOOQU'#J`'#J`OOQU,5>n,5>nOOQU-E<U-E<UO!:ZQ08SO,5:]O!<wQ08SO,5:iO%[Q^O,5:iO!?bQ08SO,5:kOOQO,5@q,5@qO!@RQ7[O,5=XO!@aQ07hO'#JaO9UQWO'#JaO!@rQ07hO,59YO!@}Q`O,59YO!AVQ7[O,59YO:RQ7[O,59YO!AbQWO,5;VO!AjQWO'#HZO!BOQWO'#KZO%[Q^O,5;zO!7{Q`O,5;|O!BWQWO,5=tO!B]QWO,5=tO!BbQWO,5=tO9kQ07hO,5=tO;sQWO,5=dOOQO'#Cu'#CuO!BpQ`O,5=aO!BxQ7[O,5=bO!CTQWO,5=dO!CYQpO,5=gO!CbQWO'#KVO>pQWO'#HQO9aQWO'#HSO!CgQWO'#HSO:RQ7[O'#HUO!ClQWO'#HUOOQU,5=j,5=jO!CqQWO'#HVO!DSQWO'#CnO!DXQWO,59OO!DcQWO,59OO!FhQ^O,59OOOQU,59O,59OO!FxQ07hO,59OO%[Q^O,59OO!ITQ^O'#H^OOQU'#H_'#H_OOQU'#H`'#H`O`Q^O,5=vO!IkQWO,5=vO`Q^O,5=|O`Q^O,5>OO!IpQWO,5>QO`Q^O,5>SO!IuQWO,5>VO!IzQ^O,5>]OOQU,5>c,5>cO%[Q^O,5>cO9kQ07hO,5>eOOQU,5>g,5>gO!NUQWO,5>gOOQU,5>i,5>iO!NUQWO,5>iOOQU,5>k,5>kO!NZQ`O'#D[O%[Q^O'#JmO!NxQ`O'#JmO# gQ`O'#DjO# xQ`O'#DjO#$ZQ^O'#DjO#$bQWO'#JlO#$jQWO,5:TO#$oQWO'#EpO#$}QWO'#JzO#%VQWO,5;ZO#%[Q`O'#DjO#%iQ`O'#EUOOQ07b,5:n,5:nO%[Q^O,5:nO#%pQWO,5:nO>pQWO,5;UO!@}Q`O,5;UO!AVQ7[O,5;UO:RQ7[O,5;UO#%xQWO,5@XO#%}Q$ISO,5:rOOQO-E<`-E<`O#'TQ07pO,5:}OCnQ`O,5:qO#'_Q`O,5:qOCnQ`O,5:}O!@rQ07hO,5:qOOQ07`'#Ef'#EfOOQO,5:},5:}O%[Q^O,5:}O#'lQ07hO,5:}O#'wQ07hO,5:}O!@}Q`O,5:qOOQO,5;T,5;TO#(VQ07hO,5:}POOO'#IV'#IVP#(kO!0LbO,58{POOO,58{,58{OOOO-E<V-E<VOOQ07b1G.o1G.oOOOO-E<W-E<WO#(vQpO,59zOOOO-E<Y-E<YOOQ07b1G/d1G/dO#({QrO,5>wO+}Q^O,5>wOOQO,5>},5>}O#)VQ^O'#I]OOQO-E<Z-E<ZO#)dQWO,5@VO#)lQrO,5@VO#)sQWO,5@dOOQ07b1G/j1G/jO%[Q^O,5@eO#){QWO'#IcOOQO-E<a-E<aO#)sQWO,5@dOOQ07`1G0t1G0tOOQ07f1G/u1G/uOOQ07f1G0X1G0XO%[Q^O,5@bO#*aQ07hO,5@bO#*rQ07hO,5@bO#*yQWO,5@aO9ZQWO,5@aO#+RQWO,5@aO#+aQWO'#IfO#*yQWO,5@aOOQ07`1G0s1G0sO!*OQ`O,5:tO!*ZQ`O,5:tOOQO,5:v,5:vO#,RQWO,5:vO#,ZQ7[O1G2sO9aQWO1G2sOOQ07b1G0q1G0qO#,iQ08SO1G0qO#-nQ08QO,5;ROOQ07b'#GR'#GRO#.[Q08SO'#JdO!$aQ^O1G0qO#0dQ7[O'#JnO#0nQWO,5:_O#0sQrO'#JoO%[Q^O'#JoO#0}QWO,5:dOOQ07b'#D['#D[OOQ07b1G0z1G0zO%[Q^O1G0zOOQ07b1G1d1G1dO#1SQWO1G0zO#3kQ08SO1G0{O#3rQ08SO1G0{O#6]Q08SO1G0{O#6dQ08SO1G0{O#8nQ08SO1G0{O#9UQ08SO1G0{O#<OQ08SO1G0{O#<VQ08SO1G0{O#>jQ08SO1G0{O#>wQ08SO1G0{O#@uQ08SO1G0{O#CuQ(CYO'#ChO#EsQ(CYO1G1^O#EzQ(CYO'#JjO!,lQWO1G1dO#F[Q08SO,5?TOOQ07`-E<g-E<gO#GOQ08SO1G0{OOQ07b1G0{1G0{O#IZQ08SO1G1aO#I}Q&jO,5<TO#JVQ&jO,5<UO#J_Q&jO'#FlO#JvQWO'#FkOOQO'#KO'#KOOOQO'#Ig'#IgO#J{Q&jO1G1kOOQ07b1G1k1G1kOOOS1G1v1G1vO#K^Q(CYO'#JiO#KhQWO,5<_O!*fQ^O,5<_OOOS-E<f-E<fOOQ07b1G1i1G1iO#KmQ`O'#J}OOQ07b,5<a,5<aO#KuQ`O,5<aOOQ07b,59e,59eO!&dQ7[O'#DPOOOO'#IZ'#IZO#KzO?MpO,59iOOQ07b,59i,59iO%[Q^O1G1|O!6[QWO'#IkO#LVQ7[O,5<uOOQ07b,5<r,5<rO!(SQ7[O'#InO#LuQ7[O,5=RO!(SQ7[O'#IpO#MhQ7[O,5=TO!&dQ7[O,5=VOOQO1G2O1G2OO#MrQpO'#CqO#NVQpO,5<nO#N^QWO'#KRO9aQWO'#KRO#NlQWO,5<pO!(SQ7[O,5<oO#NqQWO'#GUO#N|QWO,5<oO$ RQpO'#GRO$ `QpO'#KSO$ jQWO'#KSO!&dQ7[O'#KSO$ oQWO,5<sO$ tQ`O'#G^O!4eQ`O'#G^O$!VQWO'#G`O$![QWO'#GbO!3fQWO'#GeO$!aQ07hO'#ImO$!lQ`O,5<wOOQ07f,5<w,5<wO$!sQ`O'#G^O$#RQ`O'#G_O$#ZQ`O'#G_O$#`Q7[O,5=RO$#pQ7[O,5=TOOQ07b,5=W,5=WO!(SQ7[O,5?}O!(SQ7[O,5?}O$$QQWO'#IrO$$]QWO,5?|O$$eQWO,59`O$%UQ7[O,59qOOQ07b,59q,59qO$%wQ7[O,5<fO$&jQ7[O,5<hO@bQWO,5<jOOQ07b,5<k,5<kO$&tQWO,5<qO$&yQ7[O,5<vO$'ZQWO'#JuO!$aQ^O1G1}O$'`QWO1G1}O9ZQWO'#JxO9ZQWO'#EpO%[Q^O'#EpO9ZQWO'#ItO$'eQ07hO,5@rOOQU1G2w1G2wOOQU1G4X1G4XOOQ07b1G/w1G/wO!,iQWO1G/wO$)jQ08SO1G0TOOQU1G2s1G2sO!&dQ7[O1G2sO%[Q^O1G2sO#,^QWO1G2sO$+nQ7[O'#EgOOQ07`,5?{,5?{O$+xQ07hO,5?{OOQU1G.t1G.tO!@rQ07hO1G.tO!@}Q`O1G.tO!AVQ7[O1G.tO$,ZQWO1G0qO$,`QWO'#ChO$,kQWO'#K[O$,sQWO,5=uO$,xQWO'#K[O$,}QWO'#K[O$-]QWO'#IzO$-kQWO,5@uO$-sQrO1G1fOOQ07b1G1h1G1hO9aQWO1G3`O@bQWO1G3`O$-zQWO1G3`O$.PQWO1G3`OOQU1G3`1G3`O!CTQWO1G3OO!&dQ7[O1G2{O$.UQWO1G2{OOQU1G2|1G2|O!&dQ7[O1G2|O$.ZQWO1G2|O$.cQ`O'#GzOOQU1G3O1G3OO!4eQ`O'#IvO!CYQpO1G3ROOQU1G3R1G3ROOQU,5=l,5=lO$.kQ7[O,5=nO9aQWO,5=nO$![QWO,5=pO9UQWO,5=pO!@}Q`O,5=pO!AVQ7[O,5=pO:RQ7[O,5=pO$.yQWO'#KYO$/UQWO,5=qOOQU1G.j1G.jO$/ZQ07hO1G.jO@bQWO1G.jO$/fQWO1G.jO9kQ07hO1G.jO$1kQrO,5@wO$1{QWO,5@wO9ZQWO,5@wO$2WQ^O,5=xO$2_QWO,5=xOOQU1G3b1G3bO`Q^O1G3bOOQU1G3h1G3hOOQU1G3j1G3jO>kQWO1G3lO$2dQ^O1G3nO$6hQ^O'#HmOOQU1G3q1G3qO$6uQWO'#HsO>pQWO'#HuOOQU1G3w1G3wO$6}Q^O1G3wO9kQ07hO1G3}OOQU1G4P1G4POOQ07`'#GY'#GYO9kQ07hO1G4RO9kQ07hO1G4TO$;UQWO,5@XO!*fQ^O,5;[O9ZQWO,5;[O>pQWO,5:UO!*fQ^O,5:UO!@}Q`O,5:UO$;ZQ(CYO,5:UOOQO,5;[,5;[O$;eQ`O'#I^O$;{QWO,5@WOOQ07b1G/o1G/oO$<TQ`O'#IdO$<_QWO,5@fOOQ07`1G0u1G0uO# xQ`O,5:UOOQO'#Ia'#IaO$<gQ`O,5:pOOQ07f,5:p,5:pO#%sQWO1G0YOOQ07b1G0Y1G0YO%[Q^O1G0YOOQ07b1G0p1G0pO>pQWO1G0pO!@}Q`O1G0pO!AVQ7[O1G0pOOQ07`1G5s1G5sO!@rQ07hO1G0]OOQO1G0i1G0iO%[Q^O1G0iO$<nQ07hO1G0iO$<yQ07hO1G0iO!@}Q`O1G0]OCnQ`O1G0]O$=XQ07hO1G0iOOQO1G0]1G0]O$=mQ08SO1G0iPOOO-E<T-E<TPOOO1G.g1G.gOOOO1G/f1G/fO$=wQpO,5<eO$>PQrO1G4cOOQO1G4i1G4iO%[Q^O,5>wO$>ZQWO1G5qO$>cQWO1G6OO$>kQrO1G6PO9ZQWO,5>}O$>uQ08SO1G5|O%[Q^O1G5|O$?VQ07hO1G5|O$?hQWO1G5{O$?hQWO1G5{O9ZQWO1G5{O$?pQWO,5?QO9ZQWO,5?QOOQO,5?Q,5?QO$@UQWO,5?QO$'ZQWO,5?QOOQO-E<d-E<dOOQO1G0`1G0`OOQO1G0b1G0bO!,lQWO1G0bOOQU7+(_7+(_O!&dQ7[O7+(_O%[Q^O7+(_O$@dQWO7+(_O$@oQ7[O7+(_O$@}Q08SO,5=RO$CYQ08SO,5=TO$EeQ08SO,5=RO$GvQ08SO,5=TO$JXQ08SO,59qO$LaQ08SO,5<fO$NlQ08SO,5<hO%!wQ08SO,5<vOOQ07b7+&]7+&]O%%YQ08SO7+&]O%%|Q7[O'#I_O%&WQWO,5@YOOQ07b1G/y1G/yO%&`Q^O'#I`O%&mQWO,5@ZO%&uQrO,5@ZOOQ07b1G0O1G0OO%'PQWO7+&fOOQ07b7+&f7+&fO%'UQ(CYO,5:eO%[Q^O7+&xO%'`Q(CYO,5:]O%'mQ(CYO,5:iO%'wQ(CYO,5:kOOQ07b7+'O7+'OOOQO1G1o1G1oOOQO1G1p1G1pO%(RQtO,5<WO!*fQ^O,5<VOOQO-E<e-E<eOOQ07b7+'V7+'VOOOS7+'b7+'bOOOS1G1y1G1yO%(^QWO1G1yOOQ07b1G1{1G1{O%(cQpO,59kOOOO-E<X-E<XOOQ07b1G/T1G/TO%(jQ08SO7+'hOOQ07b,5?V,5?VO%)^QpO,5?VOOQ07b1G2a1G2aP!&dQ7[O'#IkPOQ07b-E<i-E<iO%)|Q7[O,5?YOOQ07b-E<l-E<lO%*oQ7[O,5?[OOQ07b-E<n-E<nO%*yQpO1G2qOOQ07b1G2Y1G2YO%+QQWO'#IjO%+`QWO,5@mO%+`QWO,5@mO%+hQWO,5@mO%+sQWO,5@mOOQO1G2[1G2[O%,RQ7[O1G2ZO!(SQ7[O1G2ZO%,cQ!LQO'#IlO%,sQWO,5@nO!&dQ7[O,5@nO%,{QpO,5@nOOQ07b1G2_1G2_OOQ07`,5<x,5<xOOQ07`,5<y,5<yO$'ZQWO,5<yOC_QWO,5<yO!@}Q`O,5<xOOQO'#Ga'#GaO%-VQWO,5<zOOQ07`,5<|,5<|O$'ZQWO,5=POOQO,5?X,5?XOOQO-E<k-E<kOOQ07f1G2c1G2cO!4eQ`O,5<xO%-_QWO,5<yO$!VQWO,5<zO!4eQ`O,5<yO!(SQ7[O'#InO%.RQ7[O1G2mO!(SQ7[O'#IpO%.tQ7[O1G2oO%/OQ7[O1G5iO%/YQ7[O1G5iOOQO,5?^,5?^OOQO-E<p-E<pOOQO1G.z1G.zO!7{Q`O,59sO%[Q^O,59sO%/gQWO1G2UO!(SQ7[O1G2]O%/lQ08SO7+'iOOQ07b7+'i7+'iO!$aQ^O7+'iO%0`QWO,5;[OOQ07`,5?`,5?`OOQ07`-E<r-E<rOOQ07b7+%c7+%cO%0eQpO'#KTO#%sQWO7+(_O%0oQrO7+(_O$@gQWO7+(_O%0vQ08QO'#ChO%1ZQ08QO,5<}O%1{QWO,5<}OOQ07`1G5g1G5gOOQU7+$`7+$`O!@rQ07hO7+$`O!@}Q`O7+$`O!$aQ^O7+&]O%2QQWO'#IyO%2iQWO,5@vOOQO1G3a1G3aO9aQWO,5@vO%2iQWO,5@vO%2qQWO,5@vOOQO,5?f,5?fOOQO-E<x-E<xOOQ07b7+'Q7+'QO%2vQWO7+(zO9kQ07hO7+(zO9aQWO7+(zO@bQWO7+(zOOQU7+(j7+(jO%2{Q08QO7+(gO!&dQ7[O7+(gO%3VQpO7+(hOOQU7+(h7+(hO!&dQ7[O7+(hO%3^QWO'#KXO%3iQWO,5=fOOQO,5?b,5?bOOQO-E<t-E<tOOQU7+(m7+(mO%4xQ`O'#HTOOQU1G3Y1G3YO!&dQ7[O1G3YO%[Q^O1G3YO%5PQWO1G3YO%5[Q7[O1G3YO9kQ07hO1G3[O$![QWO1G3[O9UQWO1G3[O!@}Q`O1G3[O!AVQ7[O1G3[O%5jQWO'#IxO%6OQWO,5@tO%6WQ`O,5@tOOQ07`1G3]1G3]OOQU7+$U7+$UO@bQWO7+$UO9kQ07hO7+$UO%6cQWO7+$UO%[Q^O1G6cO%[Q^O1G6dO%6hQ07hO1G6cO%6rQ^O1G3dO%6yQWO1G3dO%7OQ^O1G3dOOQU7+(|7+(|O9kQ07hO7+)WO`Q^O7+)YOOQU'#K_'#K_OOQU'#I{'#I{O%7VQ^O,5>XOOQU,5>X,5>XO%[Q^O'#HnO%7dQWO'#HpOOQU,5>_,5>_O9ZQWO,5>_OOQU,5>a,5>aOOQU7+)c7+)cOOQU7+)i7+)iOOQU7+)m7+)mOOQU7+)o7+)oO%7iQ`O1G5sO%7}Q(CYO1G0vO%8XQWO1G0vOOQO1G/p1G/pO%8dQ(CYO1G/pO>pQWO1G/pO!*fQ^O'#DjOOQO,5>x,5>xOOQO-E<[-E<[OOQO,5?O,5?OOOQO-E<b-E<bO!@}Q`O1G/pOOQO-E<_-E<_OOQ07f1G0[1G0[OOQ07b7+%t7+%tO#%sQWO7+%tOOQ07b7+&[7+&[O>pQWO7+&[O!@}Q`O7+&[OOQO7+%w7+%wO$=mQ08SO7+&TOOQO7+&T7+&TO%[Q^O7+&TO%8nQ07hO7+&TO!@rQ07hO7+%wO!@}Q`O7+%wO%8yQ07hO7+&TO%9XQ08SO7++hO%[Q^O7++hO%9iQWO7++gO%9iQWO7++gOOQO1G4l1G4lO9ZQWO1G4lO%9qQWO1G4lOOQO7+%|7+%|O#%sQWO<<KyO%0oQrO<<KyO%:PQWO<<KyOOQU<<Ky<<KyO!&dQ7[O<<KyO%[Q^O<<KyO%:XQWO<<KyO%:dQ08SO,5?YO%<oQ08SO,5?[O%>zQ08SO1G2ZO%A]Q08SO1G2mO%ChQ08SO1G2oO%EsQ7[O,5>yOOQO-E<]-E<]O%E}QrO,5>zO%[Q^O,5>zOOQO-E<^-E<^O%FXQWO1G5uOOQ07b<<JQ<<JQO%FaQ(CYO1G0qO%HkQ(CYO1G0{O%HrQ(CYO1G0{O%JvQ(CYO1G0{O%J}Q(CYO1G0{O%LrQ(CYO1G0{O%MYQ(CYO1G0{O& mQ(CYO1G0{O& tQ(CYO1G0{O&#rQ(CYO1G0{O&$PQ(CYO1G0{O&%}Q(CYO1G0{O&&bQ08SO<<JdO&'gQ(CYO1G0{O&)]Q(CYO'#JdO&+`Q(CYO1G1aO&+mQ(CYO1G0TO!*fQ^O'#FnOOQO'#KP'#KPOOQO1G1r1G1rO&+wQWO1G1qO&+|Q(CYO,5?TOOOS7+'e7+'eOOOO1G/V1G/VOOQ07b1G4q1G4qO!(SQ7[O7+(]O&,WQWO,5?UO9aQWO,5?UOOQO-E<h-E<hO&,fQWO1G6XO&,fQWO1G6XO&,nQWO1G6XO&,yQ7[O7+'uO&-ZQpO,5?WO&-eQWO,5?WO!&dQ7[O,5?WOOQO-E<j-E<jO&-jQpO1G6YO&-tQWO1G6YOOQ07`1G2e1G2eO$'ZQWO1G2eOOQ07`1G2d1G2dO&-|QWO1G2fO!&dQ7[O1G2fOOQ07`1G2k1G2kO!@}Q`O1G2dOC_QWO1G2eO&.RQWO1G2fO&.ZQWO1G2eO&.}Q7[O,5?YOOQ07b-E<m-E<mO&/pQ7[O,5?[OOQ07b-E<o-E<oO!(SQ7[O7++TOOQ07b1G/_1G/_O&/zQWO1G/_OOQ07b7+'p7+'pO&0PQ7[O7+'wO&0aQ08SO<<KTOOQ07b<<KT<<KTO&1TQWO1G0vO!&dQ7[O'#IsO&1YQWO,5@oO!&dQ7[O1G2iOOQU<<Gz<<GzO!@rQ07hO<<GzO&1bQ08SO<<IwOOQ07b<<Iw<<IwOOQO,5?e,5?eO&2UQWO,5?eO&2ZQWO,5?eOOQO-E<w-E<wO&2iQWO1G6bO&2iQWO1G6bO9aQWO1G6bO@bQWO<<LfOOQU<<Lf<<LfO&2qQWO<<LfO9kQ07hO<<LfOOQU<<LR<<LRO%2{Q08QO<<LROOQU<<LS<<LSO%3VQpO<<LSO&2vQ`O'#IuO&3RQWO,5@sO!*fQ^O,5@sOOQU1G3Q1G3QO&3ZQ^O'#JmOOQO'#Iw'#IwO9kQ07hO'#IwO&3eQ`O,5=oOOQU,5=o,5=oO&3lQ`O'#EcO&4QQWO7+(tO&4VQWO7+(tOOQU7+(t7+(tO!&dQ7[O7+(tO%[Q^O7+(tO&4_QWO7+(tOOQU7+(v7+(vO9kQ07hO7+(vO$![QWO7+(vO9UQWO7+(vO!@}Q`O7+(vO&4jQWO,5?dOOQO-E<v-E<vOOQO'#HW'#HWO&4uQWO1G6`O9kQ07hO<<GpOOQU<<Gp<<GpO@bQWO<<GpO&4}QWO7++}O&5SQWO7+,OO%[Q^O7++}O%[Q^O7+,OOOQU7+)O7+)OO&5XQWO7+)OO&5^Q^O7+)OO&5eQWO7+)OOOQU<<Lr<<LrOOQU<<Lt<<LtOOQU-E<y-E<yOOQU1G3s1G3sO&5jQWO,5>YOOQU,5>[,5>[O&5oQWO1G3yO9ZQWO7+&bO!*fQ^O7+&bOOQO7+%[7+%[O&5tQ(CYO1G6PO>pQWO7+%[OOQ07b<<I`<<I`OOQ07b<<Iv<<IvO>pQWO<<IvOOQO<<Io<<IoO$=mQ08SO<<IoO%[Q^O<<IoOOQO<<Ic<<IcO!@rQ07hO<<IcO&6OQ07hO<<IoO&6ZQ08SO<= SO&6kQWO<= ROOQO7+*W7+*WO9ZQWO7+*WOOQUANAeANAeO&6sQWOANAeO!&dQ7[OANAeO#%sQWOANAeO%0oQrOANAeO%[Q^OANAeO&6{Q08SO7+'uO&9^Q08SO,5?YO&;iQ08SO,5?[O&=tQ08SO7+'wO&@VQrO1G4fO&@aQ(CYO7+&]O&BeQ(CYO,5=RO&DlQ(CYO,5=TO&D|Q(CYO,5=RO&E^Q(CYO,5=TO&EnQ(CYO,59qO&GqQ(CYO,5<fO&ItQ(CYO,5<hO&KwQ(CYO,5<vO&MmQ(CYO7+'hO&MzQ(CYO7+'iO&NXQWO,5<YOOQO7+']7+']O&N^Q7[O<<KwOOQO1G4p1G4pO&NeQWO1G4pO&NpQWO1G4pO' OQWO7++sO' OQWO7++sO!&dQ7[O1G4rO' WQpO1G4rO' bQWO7++tOOQ07`7+(P7+(PO$'ZQWO7+(QO' jQpO7+(QOOQ07`7+(O7+(OO$'ZQWO7+(PO' qQWO7+(QO!&dQ7[O7+(QOC_QWO7+(PO' vQ7[O<<NoOOQ07b7+$y7+$yO'!QQpO,5?_OOQO-E<q-E<qO'![Q08QO7+(TOOQUAN=fAN=fO9aQWO1G5POOQO1G5P1G5PO'!lQWO1G5PO'!qQWO7++|O'!qQWO7++|O9kQ07hOANBQO@bQWOANBQOOQUANBQANBQOOQUANAmANAmOOQUANAnANAnO'!yQWO,5?aOOQO-E<s-E<sO'#UQ(CYO1G6_O'%fQrO'#ChOOQO,5?c,5?cOOQO-E<u-E<uOOQU1G3Z1G3ZO&3ZQ^O,5<zOOQU<<L`<<L`O!&dQ7[O<<L`O&4QQWO<<L`O'%pQWO<<L`O%[Q^O<<L`OOQU<<Lb<<LbO9kQ07hO<<LbO$![QWO<<LbO9UQWO<<LbO'%xQ`O1G5OO'&TQWO7++zOOQUAN=[AN=[O9kQ07hOAN=[OOQU<= i<= iOOQU<= j<= jO'&]QWO<= iO'&bQWO<= jOOQU<<Lj<<LjO'&gQWO<<LjO'&lQ^O<<LjOOQU1G3t1G3tO>pQWO7+)eO'&sQWO<<I|O''OQ(CYO<<I|OOQO<<Hv<<HvOOQ07bAN?bAN?bOOQOAN?ZAN?ZO$=mQ08SOAN?ZOOQOAN>}AN>}O%[Q^OAN?ZOOQO<<Mr<<MrOOQUG27PG27PO!&dQ7[OG27PO#%sQWOG27PO''YQWOG27PO%0oQrOG27PO''bQ(CYO<<JdO''oQ(CYO1G2ZO')eQ(CYO,5?YO'+hQ(CYO,5?[O'-kQ(CYO1G2mO'/nQ(CYO1G2oO'1qQ(CYO<<KTO'2OQ(CYO<<IwOOQO1G1t1G1tO!(SQ7[OANAcOOQO7+*[7+*[O'2]QWO7+*[O'2hQWO<= _O'2pQpO7+*^OOQ07`<<Kl<<KlO$'ZQWO<<KlOOQ07`<<Kk<<KkO'2zQpO<<KlO$'ZQWO<<KkOOQO7+*k7+*kO9aQWO7+*kO'3RQWO<= hOOQUG27lG27lO9kQ07hOG27lO!*fQ^O1G4{O'3ZQWO7++yO&4QQWOANAzOOQUANAzANAzO!&dQ7[OANAzO'3cQWOANAzOOQUANA|ANA|O9kQ07hOANA|O$![QWOANA|OOQO'#HX'#HXOOQO7+*j7+*jOOQUG22vG22vOOQUANETANETOOQUANEUANEUOOQUANBUANBUO'3kQWOANBUOOQU<<MP<<MPO!*fQ^OAN?hOOQOG24uG24uO$=mQ08SOG24uO#%sQWOLD,kOOQULD,kLD,kO!&dQ7[OLD,kO'3pQWOLD,kO'3xQ(CYO7+'uO'5nQ(CYO,5?YO'7qQ(CYO,5?[O'9tQ(CYO7+'wO';jQ7[OG26}OOQO<<Mv<<MvOOQ07`ANAWANAWO$'ZQWOANAWOOQ07`ANAVANAVOOQO<<NV<<NVOOQULD-WLD-WO';zQ(CYO7+*gOOQUG27fG27fO&4QQWOG27fO!&dQ7[OG27fOOQUG27hG27hO9kQ07hOG27hOOQUG27pG27pO'<UQ(CYOG25SOOQOLD*aLD*aOOQU!$(!V!$(!VO#%sQWO!$(!VO!&dQ7[O!$(!VO'<`Q08SOG26}OOQ07`G26rG26rOOQULD-QLD-QO&4QQWOLD-QOOQULD-SLD-SOOQU!)9Eq!)9EqO#%sQWO!)9EqOOQU!$(!l!$(!lOOQU!.K;]!.K;]O'>qQ(CYOG26}O!*fQ^O'#DyO1PQWO'#EWO'@gQrO'#JiO!*fQ^O'#DqO'@nQ^O'#D}O'@uQrO'#ChO'C]QrO'#ChO!*fQ^O'#EPO'CmQ^O,5;VO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O,5;aO!*fQ^O'#IiO'EpQWO,5<eO'ExQ7[O,5;aO'GcQ7[O,5;aO!*fQ^O,5;uO!&dQ7[O'#GgO'ExQ7[O'#GgO!&dQ7[O'#GiO'ExQ7[O'#GiO1SQWO'#DVO1SQWO'#DVO!&dQ7[O'#FzO'ExQ7[O'#FzO!&dQ7[O'#F|O'ExQ7[O'#F|O!&dQ7[O'#G[O'ExQ7[O'#G[O!*fQ^O,5:iO!*fQ^O,5@eO'CmQ^O1G0qO'GjQ(CYO'#ChO!*fQ^O1G1|O!&dQ7[O'#InO'ExQ7[O'#InO!&dQ7[O'#IpO'ExQ7[O'#IpO!&dQ7[O,5<oO'ExQ7[O,5<oO'CmQ^O1G1}O!*fQ^O7+&xO!&dQ7[O1G2ZO'ExQ7[O1G2ZO!&dQ7[O'#InO'ExQ7[O'#InO!&dQ7[O'#IpO'ExQ7[O'#IpO!&dQ7[O1G2]O'ExQ7[O1G2]O'CmQ^O7+'iO'CmQ^O7+&]O!&dQ7[OANAcO'ExQ7[OANAcO'GtQWO'#EkO'GyQWO'#EkO'HRQWO'#FZO'HWQWO'#EuO'H]QWO'#JyO'HhQWO'#JwO'HsQWO,5;VO'HxQ7[O,5<bO'IPQWO'#GTO'IUQWO'#GTO'IZQWO,5<cO'IcQWO,5;VO'IkQ(CYO1G1^O'IrQWO,5<oO'IwQWO,5<oO'I|QWO,5<qO'JRQWO,5<qO'JWQWO1G1}O'J]QWO1G0qO'JbQ7[O<<KwO'JiQ7[O<<KwO7hQ7[O'#FxO9UQWO'#FwOA]QWO'#EjO!*fQ^O,5;rO!3fQWO'#GTO!3fQWO'#GTO!3fQWO'#GVO!3fQWO'#GVO!(SQ7[O7+(]O!(SQ7[O7+(]O%*yQpO1G2qO%*yQpO1G2qO!&dQ7[O,5=VO!&dQ7[O,5=V",stateData:"'Km~O'tOS'uOSSOS'vRQ~OPYOQYORfOX!VO`qOczOdyOlkOnYOokOpkOvkOxYOzYO!PWO!TkO!UkO![XO!fuO!kZO!nYO!oYO!pYO!rvO!twO!wxO!{]O#s!PO$T|O%b}O%d!QO%f!OO%g!OO%h!OO%k!RO%m!SO%p!TO%q!TO%s!UO&P!WO&V!XO&X!YO&Z!ZO&]![O&`!]O&f!^O&l!_O&n!`O&p!aO&r!bO&t!cO'{SO'}TO(QUO(XVO(g[O(tiO~OVtO~P`OPYOQYORfOc!jOd!iOlkOnYOokOpkOvkOxYOzYO!PWO!TkO!UkO![!eO!fuO!kZO!nYO!oYO!pYO!rvO!t!gO!w!hO$T!kO'{!dO'}TO(QUO(XVO(g[O(tiO~O`!vOo!nO!P!oO!_!xO!`!uO!a!uO!{:dO#P!pO#Q!pO#R!wO#S!pO#T!pO#W!yO#X!yO'|!lO'}TO(QUO([!mO(g!sO~O'v!zO~OP[XZ[X`[Xn[X|[X}[X!P[X!Y[X!h[X!i[X!k[X!o[X#[[X#geX#j[X#k[X#l[X#m[X#n[X#o[X#p[X#q[X#r[X#t[X#v[X#x[X#y[X$O[X'r[X(X[X(h[X(o[X(p[X~O!d$|X~P(qO^!|O'}#OO(O!|O(P#OO~O^#PO(P#OO(Q#OO(R#PO~Ot#RO!R#SO(Y#SO(Z#UO~OPYOQYORfOc!jOd!iOlkOnYOokOpkOvkOxYOzYO!PWO!TkO!UkO![!eO!fuO!kZO!nYO!oYO!pYO!rvO!t!gO!w!hO$T!kO'{:hO'}TO(QUO(XVO(g[O(tiO~O!X#YO!Y#VO!V(_P!V(lP~P+}O!Z#bO~P`OPYOQYORfOc!jOd!iOnYOokOpkOvkOxYOzYO!PWO!TkO!UkO![!eO!fuO!kZO!nYO!oYO!pYO!rvO!t!gO!w!hO$T!kO'}TO(QUO(XVO(g[O(tiO~Ol#lO!X#hO!{]O#e#kO#f#hO'{:iO!j(iP~P.iO!k#nO'{#mO~O!w#rO!{]O%b#sO~O#g#tO~O!d#uO#g#tO~OP$]OZ$dOn$QO|#yO}#zO!P#{O!Y$aO!h$SO!i#wO!k#xO!o$]O#j$OO#k$PO#l$PO#m$PO#n$RO#o$SO#p$SO#q$cO#r$SO#t$TO#v$VO#x$XO#y$YO(XVO(h$ZO(o#|O(p#}O~O`(]X'r(]X'p(]X!j(]X!V(]X![(]X%c(]X!d(]X~P1qO#[$eO$O$eOP(^XZ(^Xn(^X|(^X}(^X!P(^X!Y(^X!h(^X!k(^X!o(^X#j(^X#k(^X#l(^X#m(^X#n(^X#o(^X#p(^X#q(^X#r(^X#t(^X#v(^X#x(^X#y(^X(X(^X(h(^X(o(^X(p(^X![(^X%c(^X~O`(^X!i(^X'r(^X'p(^X!V(^X!j(^Xr(^X!d(^X~P4XO#[$eO~O$Y$gO$[$fO$c$lO~ORfO![$mO$f$nO$h$pO~Og%VOl%WOn$tOo$sOp$sOv%XOx%YOz%ZO!P${O![$|O!f%`O!k$xO#f%aO$T%^O$o%[O$q%]O$t%_O'{$rO'}TO(QUO(X$uO(o$}O(p%POf(UP~O!k%bO~O!P%eO![%fO'{%dO~O!d%jO~O`%kO'r%kO~O'|!lO~P%[O%h%rO~P%[Og%VO!k%bO'{%dO'|!lO~Od%yO!k%bO'{%dO~O#r$SO~O|&OO![%{O!k%}O%d&RO'{%dO'|!lO'}TO(QUO_(}P~O!w#rO~O%m&TO!P(yX![(yX'{(yX~O'{&UO~O!t&ZO#s!PO%d!QO%f!OO%g!OO%h!OO%k!RO%m!SO%p!TO%q!TO~Oc&`Od&_O!w&]O%b&^O%u&[O~P;xOc&cOdyO![&bO!t&ZO!wxO!{]O#s!PO%b}O%f!OO%g!OO%h!OO%k!RO%m!SO%p!TO%q!TO%s!UO~Oa&fO#[&iO%d&dO'|!lO~P<}O!k&jO!t&nO~O!k#nO~O![XO~O`%kO'q&vO'r%kO~O`%kO'q&yO'r%kO~O`%kO'q&{O'r%kO~O'p[X!V[Xr[X!j[X&T[X![[X%c[X!d[X~P(qO!_'YO!`'RO!a'RO'|!lO'}TO(QUO~Oo'PO!P'OO!X'SO([&}O!Z(`P!Z(nP~P@UOj']O!['ZO'{%dO~Od'bO!k%bO'{%dO~O|&OO!k%}O~Oo!nO!P!oO!{:dO#P!pO#Q!pO#S!pO#T!pO'|!lO'}TO(QUO([!mO(g!sO~O!_'hO!`'gO!a'gO#R!pO#W'iO#X'iO~PApO`%kOg%VO!d#uO!k%bO'r%kO(h'kO~O!o'oO#['mO~PCOOo!nO!P!oO'}TO(QUO([!mO(g!sO~O![XOo(eX!P(eX!_(eX!`(eX!a(eX!{(eX#P(eX#Q(eX#R(eX#S(eX#T(eX#W(eX#X(eX'|(eX'}(eX(Q(eX([(eX(g(eX~O!`'gO!a'gO'|!lO~PCnO'w'sO'x'sO'y'uO~O^!|O'}'wO(O!|O(P'wO~O^#PO(P'wO(Q'wO(R#PO~Ot#RO!R#SO(Y#SO(Z'{O~O!X'}O!V'PX!V'VX!Y'PX!Y'VX~P+}O!Y(PO!V(_X~OP$]OZ$dOn$QO|#yO}#zO!P#{O!Y(PO!h$SO!i#wO!k#xO!o$]O#j$OO#k$PO#l$PO#m$PO#n$RO#o$SO#p$SO#q$cO#r$SO#t$TO#v$VO#x$XO#y$YO(XVO(h$ZO(o#|O(p#}O~O!V(_X~PGbO!V(UO~O!V(kX!Y(kX!d(kX!j(kX(h(kX~O#[(kX#g#`X!Z(kX~PIhO#[(VO!V(mX!Y(mX~O!Y(WO!V(lX~O!V(ZO~O#[$eO~PIhO!Z([O~P`O|#yO}#zO!P#{O!i#wO!k#xO(XVOP!maZ!man!ma!Y!ma!h!ma!o!ma#j!ma#k!ma#l!ma#m!ma#n!ma#o!ma#p!ma#q!ma#r!ma#t!ma#v!ma#x!ma#y!ma(h!ma(o!ma(p!ma~O`!ma'r!ma'p!ma!V!ma!j!mar!ma![!ma%c!ma!d!ma~PKOO!j(]O~O!d#uO#[(^O(h'kO!Y(jX`(jX'r(jX~O!j(jX~PMnO!P%eO![%fO!{]O#e(cO#f(bO'{%dO~O!Y(dO!j(iX~O!j(fO~O!P%eO![%fO#f(bO'{%dO~OP(^XZ(^Xn(^X|(^X}(^X!P(^X!Y(^X!h(^X!i(^X!k(^X!o(^X#j(^X#k(^X#l(^X#m(^X#n(^X#o(^X#p(^X#q(^X#r(^X#t(^X#v(^X#x(^X#y(^X(X(^X(h(^X(o(^X(p(^X~O!d#uO!j(^X~P! [O|(gO}(hO!i#wO!k#xO!{!za!P!za~O!w!za%b!za![!za#e!za#f!za'{!za~P!#`O!w(lO~OPYOQYORfOc!jOd!iOlkOnYOokOpkOvkOxYOzYO!PWO!TkO!UkO![XO!fuO!kZO!nYO!oYO!pYO!rvO!t!gO!w!hO$T!kO'{!dO'}TO(QUO(XVO(g[O(tiO~Og%VOl%WOn$tOo$sOp$sOv%XOx%YOz;QO!P${O![$|O!f<`O!k$xO#f;WO$T%^O$o;SO$q;UO$t%_O'{(pO'}TO(QUO(X$uO(o$}O(p%PO~O#g(rO~Og%VOl%WOn$tOo$sOp$sOv%XOx%YOz%ZO!P${O![$|O!f%`O!k$xO#f%aO$T%^O$o%[O$q%]O$t%_O'{(pO'}TO(QUO(X$uO(o$}O(p%PO~Of(bP~P!(SO!X(vO!j(cP~P%[O([(xO(g[O~O!P(zO!k#xO([(xO(g[O~OP:cOQ:cORfOc<[Od!iOlkOn:cOokOpkOvkOx:cOz:cO!PWO!TkO!UkO![!eO!f:fO!kZO!n:cO!o:cO!p:cO!r:gO!t:jO!w!hO$T!kO'{)YO'}TO(QUO(XVO(g[O(t<YO~O})]O!k#xO~O!Y$aO`$ma'r$ma'p$ma!j$ma!V$ma![$ma%c$ma!d$ma~O#s)aO~P!&dO|)dO!d)cO![$ZX$W$ZX$Y$ZX$[$ZX$c$ZX~O!d)cO![(qX$W(qX$Y(qX$[(qX$c(qX~O|)dO~P!.OO|)dO![(qX$W(qX$Y(qX$[(qX$c(qX~O![)fO$W)jO$Y)eO$[)eO$c)kO~O!X)nO~P!*fO$Y$gO$[$fO$c)rO~Oj$uX|$uX!P$uX!i$uX(o$uX(p$uX~OfiXf$uXjiX!YiX#[iX~P!/tOo)tO~Ot)uO(Y)vO(Z)xO~Oj*RO|)zO!P){O(o$}O(p%PO~Of)yO~P!0}Of*SO~Og%VOl%WOn$tOo$sOp$sOv%XOx%YOz;QO!P${O![$|O!f<`O!k$xO#f;WO$T%^O$o;SO$q;UO$t%_O'}TO(QUO(X$uO(o$}O(p%PO~O!X*WO'{*TO!j(uP~P!1lO#g*YO~O!k*ZO~O!X*`O'{*]O!V(vP~P!1lOn*lO!P*dO!_*jO!`*cO!a*cO!k*ZO#W*kO%Y*fO'|!lO([!mO~O!Z*iO~P!3xO!i#wOj(WX|(WX!P(WX(o(WX(p(WX!Y(WX#[(WX~Of(WX#|(WX~P!4qOj*qO#[*pOf(VX!Y(VX~O!Y*rOf(UX~O'{&UOf(UP~O!k*yO~O'{(pO~Ol*}O!P%eO!X#hO![%fO!{]O#e#kO#f#hO'{%dO!j(iP~O!d#uO#g+OO~O!P%eO!X+QO!Y(WO![%fO'{%dO!V(lP~Oo'VO!P+SO!X+RO'}TO(QUO([(xO~O!Z(nP~P!7lO!Y+TO`(zX'r(zX~OP$]OZ$dOn$QO|#yO}#zO!P#{O!h$SO!i#wO!k#xO!o$]O#j$OO#k$PO#l$PO#m$PO#n$RO#o$SO#p$SO#q$cO#r$SO#t$TO#v$VO#x$XO#y$YO(XVO(h$ZO(o#|O(p#}O~O`!ea!Y!ea'r!ea'p!ea!V!ea!j!ear!ea![!ea%c!ea!d!ea~P!8dO|#yO}#zO!P#{O!i#wO!k#xO(XVOP!qaZ!qan!qa!Y!qa!h!qa!o!qa#j!qa#k!qa#l!qa#m!qa#n!qa#o!qa#p!qa#q!qa#r!qa#t!qa#v!qa#x!qa#y!qa(h!qa(o!qa(p!qa~O`!qa'r!qa'p!qa!V!qa!j!qar!qa![!qa%c!qa!d!qa~P!:}O|#yO}#zO!P#{O!i#wO!k#xO(XVOP!saZ!san!sa!Y!sa!h!sa!o!sa#j!sa#k!sa#l!sa#m!sa#n!sa#o!sa#p!sa#q!sa#r!sa#t!sa#v!sa#x!sa#y!sa(h!sa(o!sa(p!sa~O`!sa'r!sa'p!sa!V!sa!j!sar!sa![!sa%c!sa!d!sa~P!=hOg%VOj+^O!['ZO%c+]O~O!d+`O`(TX![(TX'r(TX!Y(TX~O`%kO![XO'r%kO~Og%VO!k%bO~Og%VO!k%bO'{%dO~O!d#uO#g(rO~Oa+kO%d+lO'{+hO'}TO(QUO!Z)OP~O!Y+mO_(}X~OZ+qO~O_+rO~O![%{O'{%dO'|!lO_(}P~Og%VO#[+wO~Og%VOj+zO![$|O~O![+|O~O|,OO![XO~O%h%rO~O!w,TO~Od,YO~Oa,ZO'{#mO'}TO(QUO!Z(|P~Od%yO~O%d!QO'{&UO~P<}OZ,`O_,_O~OPYOQYORfOczOdyOlkOnYOokOpkOvkOxYOzYO!PWO!TkO!UkO!fuO!kZO!nYO!oYO!pYO!rvO!wxO!{]O%b}O'}TO(QUO(XVO(g[O(tiO~O![!eO!t!gO$T!kO'{!dO~P!DkO_,_O`%kO'r%kO~OPYOQYORfOc!jOd!iOlkOnYOokOpkOvkOxYOzYO!PWO!TkO!UkO![!eO!fuO!kZO!nYO!oYO!pYO!rvO!w!hO$T!kO'{!dO'}TO(QUO(XVO(g[O(tiO~O`,eO!twO#s!OO%f!OO%g!OO%h!OO~P!GTO!k&jO~O&V,kO~O![,mO~O&h,oO&j,pOP&eaQ&eaR&eaX&ea`&eac&ead&eal&ean&eao&eap&eav&eax&eaz&ea!P&ea!T&ea!U&ea![&ea!f&ea!k&ea!n&ea!o&ea!p&ea!r&ea!t&ea!w&ea!{&ea#s&ea$T&ea%b&ea%d&ea%f&ea%g&ea%h&ea%k&ea%m&ea%p&ea%q&ea%s&ea&P&ea&V&ea&X&ea&Z&ea&]&ea&`&ea&f&ea&l&ea&n&ea&p&ea&r&ea&t&ea'p&ea'{&ea'}&ea(Q&ea(X&ea(g&ea(t&ea!Z&ea&^&eaa&ea&c&ea~O'{,uO~Og!bX!Y!OX!Y!bX!Z!OX!Z!bX!d!OX!d!bX!k!bX#[!OX~O!d,zO#[,yOg(aX!Y#dX!Y(aX!Z#dX!Z(aX!d(aX!k(aX~Og%VO!d,|O!k%bO!Y!^X!Z!^X~Oo!nO!P!oO'}TO(QUO([!mO~OP:cOQ:cORfOc<[Od!iOlkOn:cOokOpkOvkOx:cOz:cO!PWO!TkO!UkO![!eO!f:fO!kZO!n:cO!o:cO!p:cO!r:gO!t:jO!w!hO$T!kO'}TO(QUO(XVO(g[O(t<YO~O'{;]O~P#!ZO!Y-QO!Z(`X~O!Z-SO~O!d,zO#[,yO!Y#dX!Z#dX~O!Y-TO!Z(nX~O!Z-VO~O!`-WO!a-WO'|!lO~P# xO!Z-ZO~P'_Oj-^O!['ZO~O!V-cO~Oo!za!_!za!`!za!a!za#P!za#Q!za#R!za#S!za#T!za#W!za#X!za'|!za'}!za(Q!za([!za(g!za~P!#`O!o-hO#[-fO~PCOO!`-jO!a-jO'|!lO~PCnO`%kO#[-fO'r%kO~O`%kO!d#uO#[-fO'r%kO~O`%kO!d#uO!o-hO#[-fO'r%kO(h'kO~O'w'sO'x'sO'y-oO~Or-pO~O!V'Pa!Y'Pa~P!8dO!X-tO!V'PX!Y'PX~P%[O!Y(PO!V(_a~O!V(_a~PGbO!Y(WO!V(la~O!P%eO!X-xO![%fO'{%dO!V'VX!Y'VX~O#[-zO!Y(ja!j(ja`(ja'r(ja~O!d#uO~P#*aO!Y(dO!j(ia~O!P%eO![%fO#f.OO'{%dO~Ol.TO!P%eO!X.QO![%fO!{]O#e.SO#f.QO'{%dO!Y'YX!j'YX~O}.XO!k#xO~Og%VOj.[O!['ZO%c.ZO~O`#_i!Y#_i'r#_i'p#_i!V#_i!j#_ir#_i![#_i%c#_i!d#_i~P!8dOj<fO|)zO!P){O(o$}O(p%PO~O#g#Za`#Za#[#Za'r#Za!Y#Za!j#Za![#Za!V#Za~P#-]O#g(WXP(WXZ(WX`(WXn(WX}(WX!h(WX!k(WX!o(WX#j(WX#k(WX#l(WX#m(WX#n(WX#o(WX#p(WX#q(WX#r(WX#t(WX#v(WX#x(WX#y(WX'r(WX(X(WX(h(WX!j(WX!V(WX'p(WXr(WX![(WX%c(WX!d(WX~P!4qO!Y.iOf(bX~P!0}Of.kO~O!Y.lO!j(cX~P!8dO!j.oO~O!V.qO~OP$]O|#yO}#zO!P#{O!i#wO!k#xO!o$]O(XVOZ#ii`#iin#ii!Y#ii!h#ii#k#ii#l#ii#m#ii#n#ii#o#ii#p#ii#q#ii#r#ii#t#ii#v#ii#x#ii#y#ii'r#ii(h#ii(o#ii(p#ii'p#ii!V#ii!j#iir#ii![#ii%c#ii!d#ii~O#j#ii~P#1XO#j$OO~P#1XOP$]O|#yO}#zO!P#{O!i#wO!k#xO!o$]O#j$OO#k$PO#l$PO#m$PO(XVOZ#ii`#ii!Y#ii!h#ii#n#ii#o#ii#p#ii#q#ii#r#ii#t#ii#v#ii#x#ii#y#ii'r#ii(h#ii(o#ii(p#ii'p#ii!V#ii!j#iir#ii![#ii%c#ii!d#ii~On#ii~P#3yOn$QO~P#3yOP$]On$QO|#yO}#zO!P#{O!i#wO!k#xO!o$]O#j$OO#k$PO#l$PO#m$PO#n$RO(XVO`#ii!Y#ii#t#ii#v#ii#x#ii#y#ii'r#ii(h#ii(o#ii(p#ii'p#ii!V#ii!j#iir#ii![#ii%c#ii!d#ii~OZ#ii!h#ii#o#ii#p#ii#q#ii#r#ii~P#6kOZ$dO!h$SO#o$SO#p$SO#q$cO#r$SO~P#6kOP$]OZ$dOn$QO|#yO}#zO!P#{O!h$SO!i#wO!k#xO!o$]O#j$OO#k$PO#l$PO#m$PO#n$RO#o$SO#p$SO#q$cO#r$SO#t$TO(XVO(p#}O`#ii!Y#ii#x#ii#y#ii'r#ii(h#ii(o#ii'p#ii!V#ii!j#iir#ii![#ii%c#ii!d#ii~O#v$VO~P#9lO#v#ii~P#9lOP$]OZ$dOn$QO|#yO}#zO!P#{O!h$SO!i#wO!k#xO!o$]O#j$OO#k$PO#l$PO#m$PO#n$RO#o$SO#p$SO#q$cO#r$SO#t$TO(XVO`#ii!Y#ii#x#ii#y#ii'r#ii(h#ii'p#ii!V#ii!j#iir#ii![#ii%c#ii!d#ii~O#v#ii(o#ii(p#ii~P#<^O#v$VO(o#|O(p#}O~P#<^OP$]OZ$dOn$QO|#yO}#zO!P#{O!h$SO!i#wO!k#xO!o$]O#j$OO#k$PO#l$PO#m$PO#n$RO#o$SO#p$SO#q$cO#r$SO#t$TO#v$VO#x$XO(XVO(o#|O(p#}O~O`#ii!Y#ii#y#ii'r#ii(h#ii'p#ii!V#ii!j#iir#ii![#ii%c#ii!d#ii~P#?UOP[XZ[Xn[X|[X}[X!P[X!h[X!i[X!k[X!o[X#[[X#geX#j[X#k[X#l[X#m[X#n[X#o[X#p[X#q[X#r[X#t[X#v[X#x[X#y[X$O[X(X[X(h[X(o[X(p[X!Y[X!Z[X~O#|[X~P#AoOP$]OZ:zOn:nO|#yO}#zO!P#{O!h:pO!i#wO!k#xO!o$]O#j:lO#k:mO#l:mO#m:mO#n:oO#o:pO#p:pO#q:yO#r:pO#t:qO#v:sO#x:uO#y:vO(XVO(h$ZO(o#|O(p#}O~O#|.sO~P#C|O#[:{O$O:{O#|(^X!Z(^X~P! [O`']a!Y']a'r']a'p']a!j']a!V']ar']a![']a%c']a!d']a~P!8dOP#iiZ#ii`#iin#ii}#ii!Y#ii!h#ii!i#ii!k#ii!o#ii#j#ii#k#ii#l#ii#m#ii#n#ii#o#ii#p#ii#q#ii#r#ii#t#ii#v#ii#x#ii#y#ii'r#ii(X#ii(h#ii'p#ii!V#ii!j#iir#ii![#ii%c#ii!d#ii~P#-]O`#}i!Y#}i'r#}i'p#}i!V#}i!j#}ir#}i![#}i%c#}i!d#}i~P!8dO$Y.xO$[.xO~O$Y.yO$[.yO~O!d)cO#[.zO![$`X$W$`X$Y$`X$[$`X$c$`X~O!X.{O~O![)fO$W.}O$Y)eO$[)eO$c/OO~O!Y:wO!Z(]X~P#C|O!Z/PO~O!d)cO$c(qX~O$c/RO~Ot)uO(Y)vO(Z/UO~O!V/YO~P!&dO(o$}Oj%Za|%Za!P%Za(p%Za!Y%Za#[%Za~Of%Za#|%Za~P#L^O(p%POj%]a|%]a!P%]a(o%]a!Y%]a#[%]a~Of%]a#|%]a~P#MPO!YeX!deX!jeX!j$uX(heX~P!/tO!j/bO~P#-]O!Y/cO!d#uO(h'kO!j(uX~O!j/hO~O!X*WO'{%dO!j(uP~O#g/jO~O!V$uX!Y$uX!d$|X~P!/tO!Y/kO!V(vX~P#-]O!d/mO~O!V/oO~Og%VOn/sO!d#uO!k%bO(h'kO~O'{/uO~O!d+`O~O`%kO!Y/yO'r%kO~O!Z/{O~P!3xO!`/|O!a/|O'|!lO([!mO~O!P0OO([!mO~O#W0PO~Of%Za!Y%Za#[%Za#|%Za~P!0}Of%]a!Y%]a#[%]a#|%]a~P!0}O'{&UOf'fX!Y'fX~O!Y*rOf(Ua~Of0YO~O|0ZO}0ZO!P0[Ojya(oya(pya!Yya#[ya~Ofya#|ya~P$$jO|)zO!P){Oj$na(o$na(p$na!Y$na#[$na~Of$na#|$na~P$%`O|)zO!P){Oj$pa(o$pa(p$pa!Y$pa#[$pa~Of$pa#|$pa~P$&RO#g0^O~Of%Oa!Y%Oa#[%Oa#|%Oa~P!0}O!d#uO~O#g0aO~O!Y+TO`(za'r(za~O|#yO}#zO!P#{O!i#wO!k#xO(XVOP!qiZ!qin!qi!Y!qi!h!qi!o!qi#j!qi#k!qi#l!qi#m!qi#n!qi#o!qi#p!qi#q!qi#r!qi#t!qi#v!qi#x!qi#y!qi(h!qi(o!qi(p!qi~O`!qi'r!qi'p!qi!V!qi!j!qir!qi![!qi%c!qi!d!qi~P$'pOg%VOn$tOo$sOp$sOv%XOx%YOz;QO!P${O![$|O!f<`O!k$xO#f;WO$T%^O$o;SO$q;UO$t%_O'}TO(QUO(X$uO(o$}O(p%PO~Ol0kO'{0jO~P$*ZO!d+`O`(Ta![(Ta'r(Ta!Y(Ta~O#g0qO~OZ[X!YeX!ZeX~O!Y0rO!Z)OX~O!Z0tO~OZ0uO~Oa0wO'{+hO'}TO(QUO~O![%{O'{%dO_'nX!Y'nX~O!Y+mO_(}a~O!j0zO~P!8dOZ0}O~O_1OO~O#[1RO~Oj1UO![$|O~O([(xO!Z({P~Og%VOj1_O![1[O%c1^O~OZ1iO!Y1gO!Z(|X~O!Z1jO~O_1lO`%kO'r%kO~O'{#mO'}TO(QUO~O#[$eO$O$eOP(^XZ(^Xn(^X|(^X}(^X!P(^X!Y(^X!h(^X!k(^X!o(^X#j(^X#k(^X#l(^X#m(^X#n(^X#o(^X#p(^X#q(^X#t(^X#v(^X#x(^X#y(^X(X(^X(h(^X(o(^X(p(^X~O#r1oO&T1pO`(^X!i(^X~P$/qO#[$eO#r1oO&T1pO~O`1rO~P%[O`1tO~O&^1wOP&[iQ&[iR&[iX&[i`&[ic&[id&[il&[in&[io&[ip&[iv&[ix&[iz&[i!P&[i!T&[i!U&[i![&[i!f&[i!k&[i!n&[i!o&[i!p&[i!r&[i!t&[i!w&[i!{&[i#s&[i$T&[i%b&[i%d&[i%f&[i%g&[i%h&[i%k&[i%m&[i%p&[i%q&[i%s&[i&P&[i&V&[i&X&[i&Z&[i&]&[i&`&[i&f&[i&l&[i&n&[i&p&[i&r&[i&t&[i'p&[i'{&[i'}&[i(Q&[i(X&[i(g&[i(t&[i!Z&[ia&[i&c&[i~Oa1}O!Z1{O&c1|O~P`O![XO!k2PO~O&j,pOP&eiQ&eiR&eiX&ei`&eic&eid&eil&ein&eio&eip&eiv&eix&eiz&ei!P&ei!T&ei!U&ei![&ei!f&ei!k&ei!n&ei!o&ei!p&ei!r&ei!t&ei!w&ei!{&ei#s&ei$T&ei%b&ei%d&ei%f&ei%g&ei%h&ei%k&ei%m&ei%p&ei%q&ei%s&ei&P&ei&V&ei&X&ei&Z&ei&]&ei&`&ei&f&ei&l&ei&n&ei&p&ei&r&ei&t&ei'p&ei'{&ei'}&ei(Q&ei(X&ei(g&ei(t&ei!Z&ei&^&eia&ei&c&ei~O!V2VO~O!Y!^a!Z!^a~P#C|Oo!nO!P!oO!X2]O([!mO!Y'QX!Z'QX~P@UO!Y-QO!Z(`a~O!Y'WX!Z'WX~P!7lO!Y-TO!Z(na~O!Z2dO~P'_O`%kO#[2mO'r%kO~O`%kO!d#uO#[2mO'r%kO~O`%kO!d#uO!o2qO#[2mO'r%kO(h'kO~O`%kO'r%kO~P!8dO!Y$aOr$ma~O!V'Pi!Y'Pi~P!8dO!Y(PO!V(_i~O!Y(WO!V(li~O!V(mi!Y(mi~P!8dO!Y(ji!j(ji`(ji'r(ji~P!8dO#[2sO!Y(ji!j(ji`(ji'r(ji~O!Y(dO!j(ii~O!P%eO![%fO!{]O#e2xO#f2wO'{%dO~O!P%eO![%fO#f2wO'{%dO~Oj3PO!['ZO%c3OO~Og%VOj3PO!['ZO%c3OO~O#g%ZaP%ZaZ%Za`%Zan%Za}%Za!h%Za!i%Za!k%Za!o%Za#j%Za#k%Za#l%Za#m%Za#n%Za#o%Za#p%Za#q%Za#r%Za#t%Za#v%Za#x%Za#y%Za'r%Za(X%Za(h%Za!j%Za!V%Za'p%Zar%Za![%Za%c%Za!d%Za~P#L^O#g%]aP%]aZ%]a`%]an%]a}%]a!h%]a!i%]a!k%]a!o%]a#j%]a#k%]a#l%]a#m%]a#n%]a#o%]a#p%]a#q%]a#r%]a#t%]a#v%]a#x%]a#y%]a'r%]a(X%]a(h%]a!j%]a!V%]a'p%]ar%]a![%]a%c%]a!d%]a~P#MPO#g%ZaP%ZaZ%Za`%Zan%Za}%Za!Y%Za!h%Za!i%Za!k%Za!o%Za#j%Za#k%Za#l%Za#m%Za#n%Za#o%Za#p%Za#q%Za#r%Za#t%Za#v%Za#x%Za#y%Za'r%Za(X%Za(h%Za!j%Za!V%Za'p%Za#[%Zar%Za![%Za%c%Za!d%Za~P#-]O#g%]aP%]aZ%]a`%]an%]a}%]a!Y%]a!h%]a!i%]a!k%]a!o%]a#j%]a#k%]a#l%]a#m%]a#n%]a#o%]a#p%]a#q%]a#r%]a#t%]a#v%]a#x%]a#y%]a'r%]a(X%]a(h%]a!j%]a!V%]a'p%]a#[%]ar%]a![%]a%c%]a!d%]a~P#-]O#gyaPyaZya`yanya!hya!iya!kya!oya#jya#kya#lya#mya#nya#oya#pya#qya#rya#tya#vya#xya#yya'rya(Xya(hya!jya!Vya'pyarya![ya%cya!dya~P$$jO#g$naP$naZ$na`$nan$na}$na!h$na!i$na!k$na!o$na#j$na#k$na#l$na#m$na#n$na#o$na#p$na#q$na#r$na#t$na#v$na#x$na#y$na'r$na(X$na(h$na!j$na!V$na'p$nar$na![$na%c$na!d$na~P$%`O#g$paP$paZ$pa`$pan$pa}$pa!h$pa!i$pa!k$pa!o$pa#j$pa#k$pa#l$pa#m$pa#n$pa#o$pa#p$pa#q$pa#r$pa#t$pa#v$pa#x$pa#y$pa'r$pa(X$pa(h$pa!j$pa!V$pa'p$par$pa![$pa%c$pa!d$pa~P$&RO#g%OaP%OaZ%Oa`%Oan%Oa}%Oa!Y%Oa!h%Oa!i%Oa!k%Oa!o%Oa#j%Oa#k%Oa#l%Oa#m%Oa#n%Oa#o%Oa#p%Oa#q%Oa#r%Oa#t%Oa#v%Oa#x%Oa#y%Oa'r%Oa(X%Oa(h%Oa!j%Oa!V%Oa'p%Oa#[%Oar%Oa![%Oa%c%Oa!d%Oa~P#-]O`#_q!Y#_q'r#_q'p#_q!V#_q!j#_qr#_q![#_q%c#_q!d#_q~P!8dOf'RX!Y'RX~P!(SO!Y.iOf(ba~O!X3ZO!Y'SX!j'SX~P%[O!Y.lO!j(ca~O!Y.lO!j(ca~P!8dO!V3^O~O#|!ma!Z!ma~PKOO#|!ea!Y!ea!Z!ea~P#C|O#|!qa!Z!qa~P!:}O#|!sa!Z!sa~P!=hORfO![3pO$a3qO~O!Z3uO~Or3vO~P#-]O`$jq!Y$jq'r$jq'p$jq!V$jq!j$jqr$jq![$jq%c$jq!d$jq~P!8dO!V3wO~P#-]O|)zO!P){O(p%POj'ba(o'ba!Y'ba#['ba~Of'ba#|'ba~P%)eO|)zO!P){Oj'da(o'da(p'da!Y'da#['da~Of'da#|'da~P%*WO(h$ZO~P#-]O!X3zO'{%dO!Y'^X!j'^X~O!Y/cO!j(ua~O!Y/cO!d#uO!j(ua~O!Y/cO!d#uO(h'kO!j(ua~Of$wi!Y$wi#[$wi#|$wi~P!0}O!X4SO'{*]O!V'`X!Y'`X~P!1lO!Y/kO!V(va~O!Y/kO!V(va~P#-]O!d#uO#r4[O~On4_O!d#uO(h'kO~O(o$}Oj%Zi|%Zi!P%Zi(p%Zi!Y%Zi#[%Zi~Of%Zi#|%Zi~P%-jO(p%POj%]i|%]i!P%]i(o%]i!Y%]i#[%]i~Of%]i#|%]i~P%.]Of(Vi!Y(Vi~P!0}O#[4fOf(Vi!Y(Vi~P!0}O!j4iO~O`$kq!Y$kq'r$kq'p$kq!V$kq!j$kqr$kq![$kq%c$kq!d$kq~P!8dO!V4mO~O!Y4nO![(wX~P#-]O!i#wO~P4XO`$uX![$uX%W[X'r$uX!Y$uX~P!/tO%W4pO`kXjkX|kX!PkX![kX'rkX(okX(pkX!YkX~O%W4pO~Oa4vO%d4wO'{+hO'}TO(QUO!Y'mX!Z'mX~O!Y0rO!Z)Oa~OZ4{O~O_4|O~O`%kO'r%kO~P#-]O![$|O~P#-]O!Y5UO#[5WO!Z({X~O!Z5XO~Oo!nO!P5YO!_!xO!`!uO!a!uO!{:dO#P!pO#Q!pO#R!pO#S!pO#T!pO#W5_O#X!yO'|!lO'}TO(QUO([!mO(g!sO~O!Z5^O~P%3nOj5dO![1[O%c5cO~Og%VOj5dO![1[O%c5cO~Oa5kO'{#mO'}TO(QUO!Y'lX!Z'lX~O!Y1gO!Z(|a~O'}TO(QUO([5mO~O_5qO~O#r5tO&T5uO~PMnO!j5vO~P%[O`5xO~O`5xO~P%[Oa1}O!Z5}O&c1|O~P`O!d6PO~O!d6ROg(ai!Y(ai!Z(ai!d(ai!k(ai~O!Y#di!Z#di~P#C|O#[6SO!Y#di!Z#di~O!Y!^i!Z!^i~P#C|O`%kO#[6]O'r%kO~O`%kO!d#uO#[6]O'r%kO~O!Y(jq!j(jq`(jq'r(jq~P!8dO!Y(dO!j(iq~O!P%eO![%fO#f6dO'{%dO~O!['ZO%c6gO~Oj6jO!['ZO%c6gO~O#g'baP'baZ'ba`'ban'ba}'ba!h'ba!i'ba!k'ba!o'ba#j'ba#k'ba#l'ba#m'ba#n'ba#o'ba#p'ba#q'ba#r'ba#t'ba#v'ba#x'ba#y'ba'r'ba(X'ba(h'ba!j'ba!V'ba'p'bar'ba!['ba%c'ba!d'ba~P%)eO#g'daP'daZ'da`'dan'da}'da!h'da!i'da!k'da!o'da#j'da#k'da#l'da#m'da#n'da#o'da#p'da#q'da#r'da#t'da#v'da#x'da#y'da'r'da(X'da(h'da!j'da!V'da'p'dar'da!['da%c'da!d'da~P%*WO#g$wiP$wiZ$wi`$win$wi}$wi!Y$wi!h$wi!i$wi!k$wi!o$wi#j$wi#k$wi#l$wi#m$wi#n$wi#o$wi#p$wi#q$wi#r$wi#t$wi#v$wi#x$wi#y$wi'r$wi(X$wi(h$wi!j$wi!V$wi'p$wi#[$wir$wi![$wi%c$wi!d$wi~P#-]O#g%ZiP%ZiZ%Zi`%Zin%Zi}%Zi!h%Zi!i%Zi!k%Zi!o%Zi#j%Zi#k%Zi#l%Zi#m%Zi#n%Zi#o%Zi#p%Zi#q%Zi#r%Zi#t%Zi#v%Zi#x%Zi#y%Zi'r%Zi(X%Zi(h%Zi!j%Zi!V%Zi'p%Zir%Zi![%Zi%c%Zi!d%Zi~P%-jO#g%]iP%]iZ%]i`%]in%]i}%]i!h%]i!i%]i!k%]i!o%]i#j%]i#k%]i#l%]i#m%]i#n%]i#o%]i#p%]i#q%]i#r%]i#t%]i#v%]i#x%]i#y%]i'r%]i(X%]i(h%]i!j%]i!V%]i'p%]ir%]i![%]i%c%]i!d%]i~P%.]Of'Ra!Y'Ra~P!0}O!Y'Sa!j'Sa~P!8dO!Y.lO!j(ci~O#|#_i!Y#_i!Z#_i~P#C|OP$]O|#yO}#zO!P#{O!i#wO!k#xO!o$]O(XVOZ#iin#ii!h#ii#k#ii#l#ii#m#ii#n#ii#o#ii#p#ii#q#ii#r#ii#t#ii#v#ii#x#ii#y#ii#|#ii(h#ii(o#ii(p#ii!Y#ii!Z#ii~O#j#ii~P%FnO#j:lO~P%FnOP$]O|#yO}#zO!P#{O!i#wO!k#xO!o$]O#j:lO#k:mO#l:mO#m:mO(XVOZ#ii!h#ii#n#ii#o#ii#p#ii#q#ii#r#ii#t#ii#v#ii#x#ii#y#ii#|#ii(h#ii(o#ii(p#ii!Y#ii!Z#ii~On#ii~P%HyOn:nO~P%HyOP$]On:nO|#yO}#zO!P#{O!i#wO!k#xO!o$]O#j:lO#k:mO#l:mO#m:mO#n:oO(XVO#t#ii#v#ii#x#ii#y#ii#|#ii(h#ii(o#ii(p#ii!Y#ii!Z#ii~OZ#ii!h#ii#o#ii#p#ii#q#ii#r#ii~P%KUOZ:zO!h:pO#o:pO#p:pO#q:yO#r:pO~P%KUOP$]OZ:zOn:nO|#yO}#zO!P#{O!h:pO!i#wO!k#xO!o$]O#j:lO#k:mO#l:mO#m:mO#n:oO#o:pO#p:pO#q:yO#r:pO#t:qO(XVO(p#}O#x#ii#y#ii#|#ii(h#ii(o#ii!Y#ii!Z#ii~O#v:sO~P%MpO#v#ii~P%MpOP$]OZ:zOn:nO|#yO}#zO!P#{O!h:pO!i#wO!k#xO!o$]O#j:lO#k:mO#l:mO#m:mO#n:oO#o:pO#p:pO#q:yO#r:pO#t:qO(XVO#x#ii#y#ii#|#ii(h#ii!Y#ii!Z#ii~O#v#ii(o#ii(p#ii~P& {O#v:sO(o#|O(p#}O~P& {OP$]OZ:zOn:nO|#yO}#zO!P#{O!h:pO!i#wO!k#xO!o$]O#j:lO#k:mO#l:mO#m:mO#n:oO#o:pO#p:pO#q:yO#r:pO#t:qO#v:sO#x:uO(XVO(o#|O(p#}O~O#y#ii#|#ii(h#ii!Y#ii!Z#ii~P&$^O`#zy!Y#zy'r#zy'p#zy!V#zy!j#zyr#zy![#zy%c#zy!d#zy~P!8dOj<gO|)zO!P){O(o$}O(p%PO~OP#iiZ#iin#ii}#ii!h#ii!i#ii!k#ii!o#ii#j#ii#k#ii#l#ii#m#ii#n#ii#o#ii#p#ii#q#ii#r#ii#t#ii#v#ii#x#ii#y#ii#|#ii(X#ii(h#ii!Y#ii!Z#ii~P&'UO!i#wOP(WXZ(WXj(WXn(WX|(WX}(WX!P(WX!h(WX!k(WX!o(WX#j(WX#k(WX#l(WX#m(WX#n(WX#o(WX#p(WX#q(WX#r(WX#t(WX#v(WX#x(WX#y(WX#|(WX(X(WX(h(WX(o(WX(p(WX!Y(WX!Z(WX~O#|#}i!Y#}i!Z#}i~P#C|O#|!qi!Z!qi~P$'pO!Z6|O~O!Y']a!Z']a~P#C|O!d#uO(h'kO!Y'^a!j'^a~O!Y/cO!j(ui~O!Y/cO!d#uO!j(ui~Of$wq!Y$wq#[$wq#|$wq~P!0}O!V'`a!Y'`a~P#-]O!d7TO~O!Y/kO!V(vi~P#-]O!Y/kO!V(vi~O!V7XO~O!d#uO#r7^O~On7_O!d#uO(h'kO~O|)zO!P){O(p%POj'ca(o'ca!Y'ca#['ca~Of'ca#|'ca~P&.fO|)zO!P){Oj'ea(o'ea(p'ea!Y'ea#['ea~Of'ea#|'ea~P&/XO!V7aO~Of$yq!Y$yq#[$yq#|$yq~P!0}O`$ky!Y$ky'r$ky'p$ky!V$ky!j$kyr$ky![$ky%c$ky!d$ky~P!8dO!d6RO~O!Y4nO![(wa~O`#_y!Y#_y'r#_y'p#_y!V#_y!j#_yr#_y![#_y%c#_y!d#_y~P!8dOZ7fO~Oa7hO'{+hO'}TO(QUO~O!Y0rO!Z)Oi~O_7lO~O([(xO!Y'iX!Z'iX~O!Y5UO!Z({a~OlkO'{7sO~P.iO!Z7vO~P%3nOo!nO!P7wO'}TO(QUO([!mO(g!sO~O![1[O~O![1[O%c7yO~Oj7|O![1[O%c7yO~OZ8RO!Y'la!Z'la~O!Y1gO!Z(|i~O!j8VO~O!j8WO~O!j8ZO~O!j8ZO~P%[O`8]O~O!d8^O~O!j8_O~O!Y(mi!Z(mi~P#C|O`%kO#[8gO'r%kO~O!Y(jy!j(jy`(jy'r(jy~P!8dO!Y(dO!j(iy~O!['ZO%c8jO~O#g$wqP$wqZ$wq`$wqn$wq}$wq!Y$wq!h$wq!i$wq!k$wq!o$wq#j$wq#k$wq#l$wq#m$wq#n$wq#o$wq#p$wq#q$wq#r$wq#t$wq#v$wq#x$wq#y$wq'r$wq(X$wq(h$wq!j$wq!V$wq'p$wq#[$wqr$wq![$wq%c$wq!d$wq~P#-]O#g'caP'caZ'ca`'can'ca}'ca!h'ca!i'ca!k'ca!o'ca#j'ca#k'ca#l'ca#m'ca#n'ca#o'ca#p'ca#q'ca#r'ca#t'ca#v'ca#x'ca#y'ca'r'ca(X'ca(h'ca!j'ca!V'ca'p'car'ca!['ca%c'ca!d'ca~P&.fO#g'eaP'eaZ'ea`'ean'ea}'ea!h'ea!i'ea!k'ea!o'ea#j'ea#k'ea#l'ea#m'ea#n'ea#o'ea#p'ea#q'ea#r'ea#t'ea#v'ea#x'ea#y'ea'r'ea(X'ea(h'ea!j'ea!V'ea'p'ear'ea!['ea%c'ea!d'ea~P&/XO#g$yqP$yqZ$yq`$yqn$yq}$yq!Y$yq!h$yq!i$yq!k$yq!o$yq#j$yq#k$yq#l$yq#m$yq#n$yq#o$yq#p$yq#q$yq#r$yq#t$yq#v$yq#x$yq#y$yq'r$yq(X$yq(h$yq!j$yq!V$yq'p$yq#[$yqr$yq![$yq%c$yq!d$yq~P#-]O!Y'Si!j'Si~P!8dO#|#_q!Y#_q!Z#_q~P#C|O(o$}OP%ZaZ%Zan%Za}%Za!h%Za!i%Za!k%Za!o%Za#j%Za#k%Za#l%Za#m%Za#n%Za#o%Za#p%Za#q%Za#r%Za#t%Za#v%Za#x%Za#y%Za#|%Za(X%Za(h%Za!Y%Za!Z%Za~Oj%Za|%Za!P%Za(p%Za~P&@nO(p%POP%]aZ%]an%]a}%]a!h%]a!i%]a!k%]a!o%]a#j%]a#k%]a#l%]a#m%]a#n%]a#o%]a#p%]a#q%]a#r%]a#t%]a#v%]a#x%]a#y%]a#|%]a(X%]a(h%]a!Y%]a!Z%]a~Oj%]a|%]a!P%]a(o%]a~P&BuOj<gO|)zO!P){O(p%PO~P&@nOj<gO|)zO!P){O(o$}O~P&BuO|0ZO}0ZO!P0[OPyaZyajyanya!hya!iya!kya!oya#jya#kya#lya#mya#nya#oya#pya#qya#rya#tya#vya#xya#yya#|ya(Xya(hya(oya(pya!Yya!Zya~O|)zO!P){OP$naZ$naj$nan$na}$na!h$na!i$na!k$na!o$na#j$na#k$na#l$na#m$na#n$na#o$na#p$na#q$na#r$na#t$na#v$na#x$na#y$na#|$na(X$na(h$na(o$na(p$na!Y$na!Z$na~O|)zO!P){OP$paZ$paj$pan$pa}$pa!h$pa!i$pa!k$pa!o$pa#j$pa#k$pa#l$pa#m$pa#n$pa#o$pa#p$pa#q$pa#r$pa#t$pa#v$pa#x$pa#y$pa#|$pa(X$pa(h$pa(o$pa(p$pa!Y$pa!Z$pa~OP%OaZ%Oan%Oa}%Oa!h%Oa!i%Oa!k%Oa!o%Oa#j%Oa#k%Oa#l%Oa#m%Oa#n%Oa#o%Oa#p%Oa#q%Oa#r%Oa#t%Oa#v%Oa#x%Oa#y%Oa#|%Oa(X%Oa(h%Oa!Y%Oa!Z%Oa~P&'UO#|$jq!Y$jq!Z$jq~P#C|O#|$kq!Y$kq!Z$kq~P#C|O!Z8vO~O#|8wO~P!0}O!d#uO!Y'^i!j'^i~O!d#uO(h'kO!Y'^i!j'^i~O!Y/cO!j(uq~O!V'`i!Y'`i~P#-]O!Y/kO!V(vq~O!V8}O~P#-]O!V8}O~Of(Vy!Y(Vy~P!0}O!Y'ga!['ga~P#-]O`%Vq![%Vq'r%Vq!Y%Vq~P#-]OZ9SO~O!Y0rO!Z)Oq~O#[9WO!Y'ia!Z'ia~O!Y5UO!Z({i~P#C|OP[XZ[Xn[X|[X}[X!P[X!V[X!Y[X!h[X!i[X!k[X!o[X#[[X#geX#j[X#k[X#l[X#m[X#n[X#o[X#p[X#q[X#r[X#t[X#v[X#x[X#y[X$O[X(X[X(h[X(o[X(p[X~O!d%TX#r%TX~P'#`O![1[O%c9[O~O'}TO(QUO([9aO~O!Y1gO!Z(|q~O!j9dO~O!j9eO~O!j9fO~O!j9fO~P%[O#[9iO!Y#dy!Z#dy~O!Y#dy!Z#dy~P#C|O!['ZO%c9nO~O#|#zy!Y#zy!Z#zy~P#C|OP$wiZ$win$wi}$wi!h$wi!i$wi!k$wi!o$wi#j$wi#k$wi#l$wi#m$wi#n$wi#o$wi#p$wi#q$wi#r$wi#t$wi#v$wi#x$wi#y$wi#|$wi(X$wi(h$wi!Y$wi!Z$wi~P&'UO|)zO!P){O(p%POP'baZ'baj'ban'ba}'ba!h'ba!i'ba!k'ba!o'ba#j'ba#k'ba#l'ba#m'ba#n'ba#o'ba#p'ba#q'ba#r'ba#t'ba#v'ba#x'ba#y'ba#|'ba(X'ba(h'ba(o'ba!Y'ba!Z'ba~O|)zO!P){OP'daZ'daj'dan'da}'da!h'da!i'da!k'da!o'da#j'da#k'da#l'da#m'da#n'da#o'da#p'da#q'da#r'da#t'da#v'da#x'da#y'da#|'da(X'da(h'da(o'da(p'da!Y'da!Z'da~O(o$}OP%ZiZ%Zij%Zin%Zi|%Zi}%Zi!P%Zi!h%Zi!i%Zi!k%Zi!o%Zi#j%Zi#k%Zi#l%Zi#m%Zi#n%Zi#o%Zi#p%Zi#q%Zi#r%Zi#t%Zi#v%Zi#x%Zi#y%Zi#|%Zi(X%Zi(h%Zi(p%Zi!Y%Zi!Z%Zi~O(p%POP%]iZ%]ij%]in%]i|%]i}%]i!P%]i!h%]i!i%]i!k%]i!o%]i#j%]i#k%]i#l%]i#m%]i#n%]i#o%]i#p%]i#q%]i#r%]i#t%]i#v%]i#x%]i#y%]i#|%]i(X%]i(h%]i(o%]i!Y%]i!Z%]i~O#|$ky!Y$ky!Z$ky~P#C|O#|#_y!Y#_y!Z#_y~P#C|O!d#uO!Y'^q!j'^q~O!Y/cO!j(uy~O!V'`q!Y'`q~P#-]O!V9wO~P#-]O!Y0rO!Z)Oy~O!Y5UO!Z({q~O![1[O%c:OO~O!j:RO~O!['ZO%c:WO~OP$wqZ$wqn$wq}$wq!h$wq!i$wq!k$wq!o$wq#j$wq#k$wq#l$wq#m$wq#n$wq#o$wq#p$wq#q$wq#r$wq#t$wq#v$wq#x$wq#y$wq#|$wq(X$wq(h$wq!Y$wq!Z$wq~P&'UO|)zO!P){O(p%POP'caZ'caj'can'ca}'ca!h'ca!i'ca!k'ca!o'ca#j'ca#k'ca#l'ca#m'ca#n'ca#o'ca#p'ca#q'ca#r'ca#t'ca#v'ca#x'ca#y'ca#|'ca(X'ca(h'ca(o'ca!Y'ca!Z'ca~O|)zO!P){OP'eaZ'eaj'ean'ea}'ea!h'ea!i'ea!k'ea!o'ea#j'ea#k'ea#l'ea#m'ea#n'ea#o'ea#p'ea#q'ea#r'ea#t'ea#v'ea#x'ea#y'ea#|'ea(X'ea(h'ea(o'ea(p'ea!Y'ea!Z'ea~OP$yqZ$yqn$yq}$yq!h$yq!i$yq!k$yq!o$yq#j$yq#k$yq#l$yq#m$yq#n$yq#o$yq#p$yq#q$yq#r$yq#t$yq#v$yq#x$yq#y$yq#|$yq(X$yq(h$yq!Y$yq!Z$yq~P&'UOf%_!Z!Y%_!Z#[%_!Z#|%_!Z~P!0}O!Y'iq!Z'iq~P#C|O!Y#d!Z!Z#d!Z~P#C|O#g%_!ZP%_!ZZ%_!Z`%_!Zn%_!Z}%_!Z!Y%_!Z!h%_!Z!i%_!Z!k%_!Z!o%_!Z#j%_!Z#k%_!Z#l%_!Z#m%_!Z#n%_!Z#o%_!Z#p%_!Z#q%_!Z#r%_!Z#t%_!Z#v%_!Z#x%_!Z#y%_!Z'r%_!Z(X%_!Z(h%_!Z!j%_!Z!V%_!Z'p%_!Z#[%_!Zr%_!Z![%_!Z%c%_!Z!d%_!Z~P#-]OP%_!ZZ%_!Zn%_!Z}%_!Z!h%_!Z!i%_!Z!k%_!Z!o%_!Z#j%_!Z#k%_!Z#l%_!Z#m%_!Z#n%_!Z#o%_!Z#p%_!Z#q%_!Z#r%_!Z#t%_!Z#v%_!Z#x%_!Z#y%_!Z#|%_!Z(X%_!Z(h%_!Z!Y%_!Z!Z%_!Z~P&'UOr(]X~P1qO'|!lO~P!*fO!VeX!YeX#[eX~P'#`OP[XZ[Xn[X|[X}[X!P[X!Y[X!YeX!h[X!i[X!k[X!o[X#[[X#[eX#geX#j[X#k[X#l[X#m[X#n[X#o[X#p[X#q[X#r[X#t[X#v[X#x[X#y[X$O[X(X[X(h[X(o[X(p[X~O!deX!j[X!jeX(heX~P'ASOP:cOQ:cORfOc<[Od!iOlkOn:cOokOpkOvkOx:cOz:cO!PWO!TkO!UkO![XO!f:fO!kZO!n:cO!o:cO!p:cO!r:gO!t:jO!w!hO$T!kO'{)YO'}TO(QUO(XVO(g[O(t<YO~O!Y:wO!Z$ma~Og%VOl%WOn$tOo$sOp$sOv%XOx%YOz;RO!P${O![$|O!f<aO!k$xO#f;XO$T%^O$o;TO$q;VO$t%_O'{(pO'}TO(QUO(X$uO(o$}O(p%PO~O#s)aO~P'ExO!Z[X!ZeX~P'ASO#g:kO~O!d#uO#g:kO~O#[:{O~O#r:pO~O#[;ZO!Y(mX!Z(mX~O#[:{O!Y(kX!Z(kX~O#g;[O~Of;^O~P!0}O#g;cO~O#g;dO~O!d#uO#g;eO~O!d#uO#g;[O~O#|;fO~P#C|O#g;gO~O#g;hO~O#g;mO~O#g;nO~O#g;oO~O#g;pO~O#|;qO~P!0}O#|;rO~P!0}O!i#P#Q#S#T#W#e#f#q(t$o$q$t%W%b%c%d%k%m%p%q%s%u~'vS#k!U't'|#lo#j#mn|'u$Y'u'{$[([~",goto:"$2p)SPPPPP)TPP)WP)iP*x.|PPPP5pPP6WPP<S?gP?zP?zPPP?zPAxP?zP?zP?zPA|PPBRPBlPGdPPPGhPPPPGhJiPPPJoKjPGhPMxPPPP!!WGhPPPGhPGhP!$fGhP!'z!(|!)VP!)y!)}!)yPPPPP!-Y!(|PP!-v!.pP!1dGhGh!1i!4s!9Y!9Y!=OPPP!=VGhPPPPPPPPPPP!@dP!AqPPGh!CSPGhPGhGhGhGhPGh!DfP!GnP!JrP!Jv!KQ!KU!KUP!GkP!KY!KYP!N^P!NbGhGh!Nh##k?zP?zP?z?zP#$v?z?z#'O?z#)k?z#+m?z?z#,[#.f#.f#.j#.r#.f#.zP#.fP?z#/d?z#3R?z?z5pPPP#6vPPP#7a#7aP#7aP#7w#7aPP#7}P#7tP#7t#8b#7t#8|#9S5m)W#9V)WP#9^#9^#9^P)WP)WP)WP)WPP)WP#9d#9gP#9g)WP#9kP#9nP)WP)WP)WP)WP)WP)W)WPP#9t#9z#:V#:]#:c#:i#:o#:}#;T#;Z#;e#;k#;u#<U#<[#<|#=`#=f#=l#=z#>a#@O#@^#@d#Ax#BW#Cr#DQ#DW#D^#Dd#Dn#Dt#Dz#EU#Eh#EnPPPPPPPPPP#EtPPPPPPP#Fi#Ip#KP#KW#K`PPPP$!d$%Z$+r$+u$+x$,q$,t$,w$-O$-WPP$-^$-b$.Y$/X$/]$/qPP$/u$/{$0PP$0S$0W$0Z$1P$1h$2P$2T$2W$2Z$2a$2d$2h$2lR!{RoqOXst!Z#c%j&m&o&p&r,h,m1w1zY!uQ'Z-Y1[5]Q%pvQ%xyQ&P|Q&e!VS'R!e-QQ'a!iS'g!r!xS*c$|*hQ+f%yQ+s&RQ,X&_Q-W'YQ-b'bQ-j'hQ/|*jQ1f,YR;Y:g%OdOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%j%p%}&f&i&m&o&p&r&v'O']'m'}(P(V(^(r(v(z)y+O+S,e,h,m-^-f-t-z.l.s0[0a0q1_1o1p1r1t1w1z1|2m2s3Z5Y5d5t5u5x6]7w7|8]8gS#p]:d!r)[$[$m'S)n,y,|.{2]3p5W6S9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]Q*u%ZQ+k%{Q,Z&bQ,b&jQ.c;QQ0h+^Q0l+`Q0w+lQ1n,`Q2{.[Q4v0rQ5k1gQ6i3PQ6u;RQ7h4wR8m6j&|kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%j%p%}&f&i&j&m&o&p&r&v'O'S']'m'}(P(V(^(r(v(z)n)y+O+S+^,e,h,m,y,|-^-f-t-z.[.l.s.{0[0a0q1_1o1p1r1t1w1z1|2]2m2s3P3Z3p5W5Y5d5t5u5x6S6]6j7w7|8]8g9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]t!nQ!r!u!x!y'R'Y'Z'g'h'i-Q-W-Y-j1[5]5_$v$si#u#w$c$d$x${%O%Q%[%]%a)u){)}*P*R*Y*`*p*q+]+`+w+z.Z.i/Z/j/k/m0Q0S0^1R1U1^3O3x4S4[4f4n4p5c6g7T7^7y8j8w9[9n:O:W:y:z:|:};O;P;S;T;U;V;W;X;_;`;a;b;c;d;g;h;i;j;k;l;m;n;q;r<Y<b<c<f<gQ&S|Q'P!eS'V%f-TQ+k%{Q,Z&bQ0]*yQ0w+lQ0|+rQ1m,_Q1n,`Q4v0rQ5P1OQ5k1gQ5n1iQ5o1lQ7h4wQ7k4|Q8U5qQ9V7lR9b8RrnOXst!V!Z#c%j&d&m&o&p&r,h,m1w1zR,]&f&v^OPXYstuvwz!Z!`!g!j!o#R#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%j%p%}&f&i&j&m&o&p&r&v'O']'m(P(V(^(r(v(z)n)y+O+S+^,e,h,m,y,|-^-f-t-z.[.l.s.{0[0a0q1_1o1p1r1t1w1z1|2]2m2s3P3Z3p5W5Y5d5t5u5x6S6]6j7w7|8]8g9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<[<][#[WZ#V#Y'S'}!S%gm#g#h#k%b%e(W(b(c(d+Q+R+T,d,z-x.O.P.Q.S2P2w2x6R6dQ%sxQ%wyS%||&RQ&Y!TQ'^!hQ'`!iQ(k#rS*V$x*ZS+e%x%yQ+i%{Q,S&]Q,W&_S-a'a'bQ.^(lQ/g*WQ0p+fQ0v+lQ0x+mQ0{+qQ1a,TS1e,X,YQ2i-bQ3y/cQ4u0rQ4y0uQ5O0}Q5j1fQ7Q3zQ7g4wQ7j4{Q9R7fR9y9S!O$zi#w%O%Q%[%]%a)}*P*Y*p*q.i/j0Q0S0^3x4f8w<Y<b<c!S%uy!i!t%w%x%y'Q'`'a'b'f'p*b+e+f,}-a-b-i/t0p2b2i2p4^Q+_%sQ+x&VQ+{&WQ,V&_Q.](kQ1`,SU1d,W,X,YQ3Q.^Q5e1aS5i1e1fQ8Q5j#W<^#u$c$d$x${)u){*R*`+]+`+w+z.Z/Z/k/m1R1U1^3O4S4[4n4p5c6g7T7^7y8j9[9n:O:W:|;O;S;U;W;_;a;c;g;i;k;m;q<f<go<_:y:z:};P;T;V;X;`;b;d;h;j;l;n;rW%Ti%V*r<YS&V!Q&dQ&W!RQ&X!SR+v&T$w%Si#u#w$c$d$x${%O%Q%[%]%a)u){)}*P*R*Y*`*p*q+]+`+w+z.Z.i/Z/j/k/m0Q0S0^1R1U1^3O3x4S4[4f4n4p5c6g7T7^7y8j8w9[9n:O:W:y:z:|:};O;P;S;T;U;V;W;X;_;`;a;b;c;d;g;h;i;j;k;l;m;n;q;r<Y<b<c<f<gT)v$u)wV*v%Z;Q;RU'V!e%f-TS(y#y#zQ+p&OS.V(g(hQ1V+|Q4g0ZR7p5U&|kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%j%p%}&f&i&j&m&o&p&r&v'O'S']'m'}(P(V(^(r(v(z)n)y+O+S+^,e,h,m,y,|-^-f-t-z.[.l.s.{0[0a0q1_1o1p1r1t1w1z1|2]2m2s3P3Z3p5W5Y5d5t5u5x6S6]6j7w7|8]8g9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]$i$`c#X#d%n%o%q'|(S(n(u(})O)P)Q)R)S)T)U)V)W)X)Z)^)b)l+Z+o-O-m-r-w-y.h.n.r.t.u.v/V0_2W2Z2k2r3Y3_3`3a3b3c3d3e3f3g3h3i3j3k3n3o3t4k4s6U6[6a6o6p6y6z7r8a8e8n8t8u9k9{:S:e<PT#SV#T&}kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%j%p%}&f&i&j&m&o&p&r&v'O'S']'m'}(P(V(^(r(v(z)n)y+O+S+^,e,h,m,y,|-^-f-t-z.[.l.s.{0[0a0q1_1o1p1r1t1w1z1|2]2m2s3P3Z3p5W5Y5d5t5u5x6S6]6j7w7|8]8g9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]Q'T!eR2^-Qv!nQ!e!r!u!x!y'R'Y'Z'g'h'i-Q-W-Y-j1[5]5_S*b$|*hS/t*c*jQ/}*kQ1X,OQ4^/|R4a0PnqOXst!Z#c%j&m&o&p&r,h,m1w1zQ&t!^Q'q!wS(m#t:kQ+c%vQ,Q&YQ,R&[Q-_'_Q-l'jS.g(r;[S0`+O;eQ0n+dQ1Z,PQ2O,oQ2Q,pQ2Y,{Q2g-`Q2j-dS4l0a;oQ4q0oS4t0q;pQ6T2[Q6X2hQ6^2oQ7e4rQ8b6VQ8c6YQ8f6_R9h8_$d$_c#X#d%o%q'|(S(n(u(})O)P)Q)R)S)T)U)V)W)X)Z)^)b)l+Z+o-O-m-r-w-y.h.n.r.u.v/V0_2W2Z2k2r3Y3_3`3a3b3c3d3e3f3g3h3i3j3k3n3o3t4k4s6U6[6a6o6p6y6z7r8a8e8n8t8u9k9{:S:e<PS(j#o'dU*o%R(q3mS+Y%n.tQ2|0hQ6f2{Q8l6iR9o8m$d$^c#X#d%o%q'|(S(n(u(})O)P)Q)R)S)T)U)V)W)X)Z)^)b)l+Z+o-O-m-r-w-y.h.n.r.u.v/V0_2W2Z2k2r3Y3_3`3a3b3c3d3e3f3g3h3i3j3k3n3o3t4k4s6U6[6a6o6p6y6z7r8a8e8n8t8u9k9{:S:e<PS(i#o'dS({#z$_S+X%n.tS.W(h(jQ.w)]Q0e+YR2y.X&|kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%j%p%}&f&i&j&m&o&p&r&v'O'S']'m'}(P(V(^(r(v(z)n)y+O+S+^,e,h,m,y,|-^-f-t-z.[.l.s.{0[0a0q1_1o1p1r1t1w1z1|2]2m2s3P3Z3p5W5Y5d5t5u5x6S6]6j7w7|8]8g9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]S#p]:dQ&o!XQ&p!YQ&r![Q&s!]R1v,kQ'[!hQ+[%sQ-]'^S.Y(k+_Q2e-[W2}.].^0g0iQ6W2fU6e2z2|3QS8i6f6hS9m8k8lS:U9l9oQ:^:VR:a:_U!vQ'Z-YT5Z1[5]!Q_OXZ`st!V!Z#c#g%b%j&d&f&m&o&p&r(d,h,m.P1w1z]!pQ!r'Z-Y1[5]T#p]:d%Y{OPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%j%p%}&f&i&j&m&o&p&r&v'O']'m'}(P(V(^(r(v(z)y+O+S+^,e,h,m-^-f-t-z.[.l.s0[0a0q1_1o1p1r1t1w1z1|2m2s3P3Z5Y5d5t5u5x6]6j7w7|8]8gS(y#y#zS.V(g(h!s;v$[$m'S)n,y,|.{2]3p5W6S9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]Y!tQ'Z-Y1[5]Q'f!rS'p!u!xS'r!y5_S-i'g'hQ-k'iR2p-jQ'o!tS(`#f1qS-h'f'rQ/f*VQ/r*bQ2q-kQ4O/gS4X/s/}Q7P3yS7[4_4aQ8y7QR9Q7_Q#vbQ'n!tS(_#f1qS(a#l*}Q+P%cQ+a%tQ+g%zU-g'f'o'rQ-{(`Q/e*VQ/q*bQ/w*eQ0m+bQ1b,US2n-h-kQ2v.TS3}/f/gS4W/r/}Q4Z/vQ4]/xQ5g1cQ6`2qQ7O3yQ7S4OS7W4X4aQ7]4`Q8O5hS8x7P7QQ8|7XQ9O7[Q9_8PQ9u8yQ9v8}Q9x9QQ:Q9`Q:Y9wQ;y;tQ<U;}R<V<OV!vQ'Z-Y%YaOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%j%p%}&f&i&j&m&o&p&r&v'O']'m'}(P(V(^(r(v(z)y+O+S+^,e,h,m-^-f-t-z.[.l.s0[0a0q1_1o1p1r1t1w1z1|2m2s3P3Z5Y5d5t5u5x6]6j7w7|8]8gS#vz!j!r;s$[$m'S)n,y,|.{2]3p5W6S9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]R;y<[%YbOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%j%p%}&f&i&j&m&o&p&r&v'O']'m'}(P(V(^(r(v(z)y+O+S+^,e,h,m-^-f-t-z.[.l.s0[0a0q1_1o1p1r1t1w1z1|2m2s3P3Z5Y5d5t5u5x6]6j7w7|8]8gQ%cj!S%ty!i!t%w%x%y'Q'`'a'b'f'p*b+e+f,}-a-b-i/t0p2b2i2p4^S%zz!jQ+b%uQ,U&_W1c,V,W,X,YU5h1d1e1fS8P5i5jQ9`8Q!r;t$[$m'S)n,y,|.{2]3p5W6S9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]Q;}<ZR<O<[$|eOPXYstuvw!Z!`!g!o#R#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%j%p%}&f&i&m&o&p&r&v'O']'m(P(V(^(r(v(z)y+O+S+^,e,h,m-^-f-t-z.[.l.s0[0a0q1_1o1p1r1t1w1z1|2m2s3P3Z5Y5d5t5u5x6]6j7w7|8]8gY#aWZ#V#Y'}!S%gm#g#h#k%b%e(W(b(c(d+Q+R+T,d,z-x.O.P.Q.S2P2w2x6R6dQ,c&j!p;u$[$m)n,y,|.{2]3p5W6S9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]R;x'SS'W!e%fR2`-T%OdOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%j%p%}&f&i&m&o&p&r&v'O']'m'}(P(V(^(r(v(z)y+O+S,e,h,m-^-f-t-z.l.s0[0a0q1_1o1p1r1t1w1z1|2m2s3Z5Y5d5t5u5x6]7w7|8]8g!r)[$[$m'S)n,y,|.{2]3p5W6S9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]Q,b&jQ0h+^Q2{.[Q6i3PR8m6j!b$Uc#X%n'|(S(n(u)W)X)^)b+o-m-r-w-y.h.n/V0_2k2r3Y3k4k4s6[6a6o8e9k:e!P:r)Z)l-O.t2W2Z3_3i3j3n3t6U6p6y6z7r8a8n8t8u9{:S<P!f$Wc#X%n'|(S(n(u)T)U)W)X)^)b+o-m-r-w-y.h.n/V0_2k2r3Y3k4k4s6[6a6o8e9k:e!T:t)Z)l-O.t2W2Z3_3f3g3i3j3n3t6U6p6y6z7r8a8n8t8u9{:S<P!^$[c#X%n'|(S(n(u)^)b+o-m-r-w-y.h.n/V0_2k2r3Y3k4k4s6[6a6o8e9k:eQ3x/az<])Z)l-O.t2W2Z3_3n3t6U6p6y6z7r8a8n8t8u9{:S<PQ<b<dR<c<e&|kOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m%j%p%}&f&i&j&m&o&p&r&v'O'S']'m'}(P(V(^(r(v(z)n)y+O+S+^,e,h,m,y,|-^-f-t-z.[.l.s.{0[0a0q1_1o1p1r1t1w1z1|2]2m2s3P3Z3p5W5Y5d5t5u5x6S6]6j7w7|8]8g9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]S$nh$oR3q.z'TgOPWXYZhstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m$o%j%p%}&f&i&j&m&o&p&r&v'O'S']'m'}(P(V(^(r(v(z)n)y+O+S+^,e,h,m,y,|-^-f-t-z.[.l.s.z.{0[0a0q1_1o1p1r1t1w1z1|2]2m2s3P3Z3p5W5Y5d5t5u5x6S6]6j7w7|8]8g9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]T$jf$pQ$hfS)e$k)iR)q$pT$if$pT)g$k)i'ThOPWXYZhstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$[$a$e$m$o%j%p%}&f&i&j&m&o&p&r&v'O'S']'m'}(P(V(^(r(v(z)n)y+O+S+^,e,h,m,y,|-^-f-t-z.[.l.s.z.{0[0a0q1_1o1p1r1t1w1z1|2]2m2s3P3Z3p5W5Y5d5t5u5x6S6]6j7w7|8]8g9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]T$nh$oQ$qhR)p$o%YjOPWXYZstuvw!Z!`!g!o#R#V#Y#c#n#t#x#{$O$P$Q$R$S$T$U$V$W$X$Y$a$e%j%p%}&f&i&j&m&o&p&r&v'O']'m'}(P(V(^(r(v(z)y+O+S+^,e,h,m-^-f-t-z.[.l.s0[0a0q1_1o1p1r1t1w1z1|2m2s3P3Z5Y5d5t5u5x6]6j7w7|8]8g!s<Z$[$m'S)n,y,|.{2]3p5W6S9W9i:c:f:g:j:k:l:m:n:o:p:q:r:s:t:u:v:w:{;Y;Z;[;^;e;f;o;p<]#clOPXZst!Z!`!o#R#c#n#{$m%j&f&i&j&m&o&p&r&v'O'](z)n+S+^,e,h,m-^.[.{0[1_1o1p1r1t1w1z1|3P3p5Y5d5t5u5x6j7w7|8]!O%Ri#w%O%Q%[%]%a)}*P*Y*p*q.i/j0Q0S0^3x4f8w<Y<b<c#W(q#u$c$d$x${)u){*R*`+]+`+w+z.Z/Z/k/m1R1U1^3O4S4[4n4p5c6g7T7^7y8j9[9n:O:W:|;O;S;U;W;_;a;c;g;i;k;m;q<f<gQ*z%_Q/W)zo3m:y:z:};P;T;V;X;`;b;d;h;j;l;n;r!O$yi#w%O%Q%[%]%a)}*P*Y*p*q.i/j0Q0S0^3x4f8w<Y<b<cQ*[$zS*e$|*hQ*{%`Q/x*f#W;{#u$c$d$x${)u){*R*`+]+`+w+z.Z/Z/k/m1R1U1^3O4S4[4n4p5c6g7T7^7y8j9[9n:O:W:|;O;S;U;W;_;a;c;g;i;k;m;q<f<gn;|:y:z:};P;T;V;X;`;b;d;h;j;l;n;rQ<Q<^Q<R<_Q<S<`R<T<a!O%Ri#w%O%Q%[%]%a)}*P*Y*p*q.i/j0Q0S0^3x4f8w<Y<b<c#W(q#u$c$d$x${)u){*R*`+]+`+w+z.Z/Z/k/m1R1U1^3O4S4[4n4p5c6g7T7^7y8j9[9n:O:W:|;O;S;U;W;_;a;c;g;i;k;m;q<f<go3m:y:z:};P;T;V;X;`;b;d;h;j;l;n;rnoOXst!Z#c%j&m&o&p&r,h,m1w1zQ*_${Q,v&yQ,w&{R4R/k$v%Si#u#w$c$d$x${%O%Q%[%]%a)u){)}*P*R*Y*`*p*q+]+`+w+z.Z.i/Z/j/k/m0Q0S0^1R1U1^3O3x4S4[4f4n4p5c6g7T7^7y8j8w9[9n:O:W:y:z:|:};O;P;S;T;U;V;W;X;_;`;a;b;c;d;g;h;i;j;k;l;m;n;q;r<Y<b<c<f<gQ+y&WQ1T+{Q5S1SR7o5TT*g$|*hS*g$|*hT5[1[5]S/v*d5YT4`0O7wQ+a%tQ/w*eQ0m+bQ1b,UQ5g1cQ8O5hQ9_8PR:Q9`!O%Oi#w%O%Q%[%]%a)}*P*Y*p*q.i/j0Q0S0^3x4f8w<Y<b<cr)}$v(s*O*n*|/i0U0V3W4P4j6}7`9t;z<W<XS0Q*m0R#W:|#u$c$d$x${)u){*R*`+]+`+w+z.Z/Z/k/m1R1U1^3O4S4[4n4p5c6g7T7^7y8j9[9n:O:W:|;O;S;U;W;_;a;c;g;i;k;m;q<f<gn:}:y:z:};P;T;V;X;`;b;d;h;j;l;n;r!^;_(o)`*U*^._.b.f/S/X/a/n0f1Q1S3T4Q4U5R5T6k6n7U7Y7b7d8{9P:X<d<e`;`3l6q6t6x8o9p9s:bS;i.a3UT;j6s8r!O%Qi#w%O%Q%[%]%a)}*P*Y*p*q.i/j0Q0S0^3x4f8w<Y<b<cv*P$v(s*Q*m*|/]/i0U0V3W4P4b4j6}7`9t;z<W<XS0S*n0T#W;O#u$c$d$x${)u){*R*`+]+`+w+z.Z/Z/k/m1R1U1^3O4S4[4n4p5c6g7T7^7y8j9[9n:O:W:|;O;S;U;W;_;a;c;g;i;k;m;q<f<gn;P:y:z:};P;T;V;X;`;b;d;h;j;l;n;r!b;a(o)`*U*^.`.a.f/S/X/a/n0f1Q1S3R3T4Q4U5R5T6k6l6n7U7Y7b7d8{9P:X<d<ed;b3l6r6s6x8o8p9p9q9s:bS;k.b3VT;l6t8srnOXst!V!Z#c%j&d&m&o&p&r,h,m1w1zQ&a!UR,e&jrnOXst!V!Z#c%j&d&m&o&p&r,h,m1w1zR&a!UQ+}&XR1P+vsnOXst!V!Z#c%j&d&m&o&p&r,h,m1w1zQ1],SS5b1`1aU7x5`5a5eS9Z7z7{S9|9Y9]Q:Z9}R:`:[Q&h!VR,^&dR5n1iS%||&RR0x+mQ&m!WR,h&nR,n&sT1x,m1zR,r&tQ,q&tR2R,rQ't!zR-n'tSsOtQ#cXT%ms#cQ!}TR'v!}Q#QUR'x#QQ)w$uR/T)wQ#TVR'z#TQ#WWU(Q#W(R-uQ(R#XR-u(SQ-R'TR2_-RQ.j(sR3X.jQ.m(uS3[.m3]R3].nQ-Y'ZR2c-YY!rQ'Z-Y1[5]R'e!rS#^W%eU(X#^(Y-vQ(Y#_R-v(TQ-U'WR2a-Ut`OXst!V!Z#c%j&d&f&m&o&p&r,h,m1w1zS#gZ%bU#q`#g.PR.P(dQ(e#iQ-|(aW.U(e-|2t6bQ2t-}R6b2uQ)i$kR.|)iQ$ohR)o$oQ$bcU)_$b-q:xQ-q:eR:x)lQ/d*VW3{/d3|7R8zU3|/e/f/gS7R3}4OR8z7S$X)|$v(o(s)`*U*^*m*n*w*x*|.a.b.d.e.f/S/X/]/_/a/i/n0U0V0f1Q1S3R3S3T3W3l4P4Q4U4b4d4j5R5T6k6l6m6n6s6t6v6w6x6}7U7Y7`7b7d8o8p8q8{9P9p9q9r9s9t:X:b;z<W<X<d<eQ/l*^U4T/l4V7VQ4V/nR7V4UQ*h$|R/z*hr*O$v(s*m*n*|/i0U0V3W4P4j6}7`9t;z<W<X!^._(o)`*U*^.a.b.f/S/X/a/n0f1Q1S3T4Q4U5R5T6k6n7U7Y7b7d8{9P:X<d<eU/^*O._6qa6q3l6s6t6x8o9p9s:bQ0R*mQ3U.aU4c0R3U8rR8r6sv*Q$v(s*m*n*|/]/i0U0V3W4P4b4j6}7`9t;z<W<X!b.`(o)`*U*^.a.b.f/S/X/a/n0f1Q1S3R3T4Q4U5R5T6k6l6n7U7Y7b7d8{9P:X<d<eU/`*Q.`6re6r3l6s6t6x8o8p9p9q9s:bQ0T*nQ3V.bU4e0T3V8sR8s6tQ*s%UR0X*sQ4o0fR7c4oQ+U%hR0d+UQ5V1VS7q5V9XR9X7rQ,P&YR1Y,PQ5]1[R7u5]Q1h,ZS5l1h8SR8S5nQ0s+iW4x0s4z7i9TQ4z0vQ7i4yR9T7jQ+n%|R0y+nQ1z,mR5|1zYrOXst#cQ&q!ZQ+W%jQ,g&mQ,i&oQ,j&pQ,l&rQ1u,hS1x,m1zR5{1wQ%lpQ&u!_Q&x!aQ&z!bQ&|!cQ'l!tQ+V%iQ+c%vQ+u&SQ,]&hQ,t&wW-e'f'n'o'rQ-l'jQ/y*gQ0n+dS1k,^,aQ2S,sQ2T,vQ2U,wQ2j-dW2l-g-h-k-mQ4q0oQ4}0|Q5Q1QQ5f1bQ5p1mQ5z1vU6Z2k2n2qQ6^2oQ7e4rQ7m5PQ7n5RQ7t5[Q7}5gQ8T5oS8d6[6`Q8f6_Q9U7kQ9^8OQ9c8UQ9j8eQ9z9VQ:P9_Q:T9kR:]:QQ%vyQ'_!iQ'j!tU+d%w%x%yQ,{'QU-`'`'a'bS-d'f'pQ/p*bS0o+e+fQ2[,}S2h-a-bQ2o-iQ4Y/tQ4r0pQ6V2bQ6Y2iQ6_2pR7Z4^S$wi<YR*t%VU%Ui%V<YR0W*rQ$viS(o#u+`Q(s#wS)`$c$dQ*U$xQ*^${Q*m%OQ*n%QQ*w%[Q*x%]Q*|%aQ.a:|Q.b;OQ.d;SQ.e;UQ.f;WQ/S)uS/X){/ZQ/])}Q/_*PQ/a*RQ/i*YQ/n*`Q0U*pQ0V*qh0f+].Z1^3O5c6g7y8j9[9n:O:WQ1Q+wQ1S+zQ3R;_Q3S;aQ3T;cQ3W.iS3l:y:zQ4P/jQ4Q/kQ4U/mQ4b0QQ4d0SQ4j0^Q5R1RQ5T1UQ6k;gQ6l;iQ6m;kQ6n;mQ6s:}Q6t;PQ6v;TQ6w;VQ6x;XQ6}3xQ7U4SQ7Y4[Q7`4fQ7b4nQ7d4pQ8o;dQ8p;`Q8q;bQ8{7TQ9P7^Q9p;hQ9q;jQ9r;lQ9s;nQ9t8wQ:X;qQ:b;rQ;z<YQ<W<bQ<X<cQ<d<fR<e<gnpOXst!Z#c%j&m&o&p&r,h,m1w1zQ!fPS#eZ#nQ&w!`U'c!o5Y7wQ'y#RQ(|#{Q)m$mS,a&f&iQ,f&jQ,s&vQ,x'OQ-[']Q.p(zQ/Q)nQ0b+SQ0i+^Q1s,eQ2f-^Q2|.[Q3s.{Q4h0[Q5a1_Q5r1oQ5s1pQ5w1rQ5y1tQ6O1|Q6f3PQ6{3pQ7{5dQ8X5tQ8Y5uQ8[5xQ8l6jQ9]7|R9g8]#WcOPXZst!Z!`!o#c#n#{%j&f&i&j&m&o&p&r&v'O'](z+S+^,e,h,m-^.[0[1_1o1p1r1t1w1z1|3P5Y5d5t5u5x6j7w7|8]Q#XWQ#dYQ%nuQ%ovS%qw!gS'|#V(PQ(S#YQ(n#tQ(u#xQ(}$OQ)O$PQ)P$QQ)Q$RQ)R$SQ)S$TQ)T$UQ)U$VQ)V$WQ)W$XQ)X$YQ)Z$[Q)^$aQ)b$eW)l$m)n.{3pQ+Z%pQ+o%}S-O'S2]Q-m'mS-r'}-tQ-w(VQ-y(^Q.h(rQ.n(vQ.r:cQ.t:fQ.u:gQ.v:jQ/V)yQ0_+OQ2W,yQ2Z,|Q2k-fQ2r-zQ3Y.lQ3_:kQ3`:lQ3a:mQ3b:nQ3c:oQ3d:pQ3e:qQ3f:rQ3g:sQ3h:tQ3i:uQ3j:vQ3k.sQ3n:{Q3o;YQ3t:wQ4k0aQ4s0qQ6U;ZQ6[2mQ6a2sQ6o3ZQ6p;[Q6y;^Q6z;eQ7r5WQ8a6SQ8e6]Q8n;fQ8t;oQ8u;pQ9k8gQ9{9WQ:S9iQ:e#RR<P<]R#ZWR'U!eY!tQ'Z-Y1[5]S'Q!e-QQ'f!rS'p!u!xS'r!y5_S,}'R'YS-i'g'hQ-k'iQ2b-WR2p-jR(t#wR(w#xQ!fQT-X'Z-Y]!qQ!r'Z-Y1[5]Q#o]R'd:dT#jZ%bS#iZ%bS%hm,dU(a#g#h#kS-}(b(cQ.R(dQ0c+TQ2u.OU2v.P.Q.SS6c2w2xR8h6d`#]W#V#Y%e'}(W+Q-xr#fZm#g#h#k%b(b(c(d+T.O.P.Q.S2w2x6dQ1q,dQ2X,zQ6Q2PQ8`6RT;w'S+RT#`W%eS#_W%eS(O#V(WS(T#Y+QS-P'S+RT-s'}-xT'X!e%fQ$kfR)s$pT)h$k)iR3r.zT*X$x*ZR*a${Q0g+]Q2z.ZQ5`1^Q6h3OQ7z5cQ8k6gQ9Y7yQ9l8jQ9}9[Q:V9nQ:[:OR:_:WnqOXst!Z#c%j&m&o&p&r,h,m1w1zQ&g!VR,]&dtmOXst!U!V!Z#c%j&d&m&o&p&r,h,m1w1zR,d&jT%im,dR1W+|R,[&bQ&Q|R+t&RR+j%{T&k!W&nT&l!W&nT1y,m1z",nodeNames:"⚠ ArithOp ArithOp JSXStartTag LineComment BlockComment Script Hashbang ExportDeclaration export Star as VariableName String Escape from ; default FunctionDeclaration async function VariableDefinition > < TypeParamList TypeDefinition extends ThisType this LiteralType ArithOp Number BooleanLiteral TemplateType InterpolationEnd Interpolation InterpolationStart NullType null VoidType void TypeofType typeof MemberExpression . ?. PropertyName [ TemplateString Escape Interpolation super RegExp ] ArrayExpression Spread , } { ObjectExpression Property async get set PropertyDefinition Block : NewExpression new TypeArgList CompareOp < ) ( ArgList UnaryExpression delete LogicOp BitOp YieldExpression yield AwaitExpression await ParenthesizedExpression ClassExpression class ClassBody MethodDeclaration Decorator @ MemberExpression PrivatePropertyName CallExpression declare Privacy static abstract override PrivatePropertyDefinition PropertyDeclaration readonly accessor Optional TypeAnnotation Equals StaticBlock FunctionExpression ArrowFunction ParamList ParamList ArrayPattern ObjectPattern PatternProperty Privacy readonly Arrow MemberExpression BinaryExpression ArithOp ArithOp ArithOp ArithOp BitOp CompareOp instanceof satisfies in const CompareOp BitOp BitOp BitOp LogicOp LogicOp ConditionalExpression LogicOp LogicOp AssignmentExpression UpdateOp PostfixExpression CallExpression TaggedTemplateExpression DynamicImport import ImportMeta JSXElement JSXSelfCloseEndTag JSXSelfClosingTag JSXIdentifier JSXBuiltin JSXIdentifier JSXNamespacedName JSXMemberExpression JSXSpreadAttribute JSXAttribute JSXAttributeValue JSXEscape JSXEndTag JSXOpenTag JSXFragmentTag JSXText JSXEscape JSXStartCloseTag JSXCloseTag PrefixCast ArrowFunction TypeParamList SequenceExpression KeyofType keyof UniqueType unique ImportType InferredType infer TypeName ParenthesizedType FunctionSignature ParamList NewSignature IndexedType TupleType Label ArrayType ReadonlyType ObjectType MethodType PropertyType IndexSignature PropertyDefinition CallSignature TypePredicate is NewSignature new UnionType LogicOp IntersectionType LogicOp ConditionalType ParameterizedType ClassDeclaration abstract implements type VariableDeclaration let var using TypeAliasDeclaration InterfaceDeclaration interface EnumDeclaration enum EnumBody NamespaceDeclaration namespace module AmbientDeclaration declare GlobalDeclaration global ClassDeclaration ClassBody AmbientFunctionDeclaration ExportGroup VariableName VariableName ImportDeclaration ImportGroup ForStatement for ForSpec ForInSpec ForOfSpec of WhileStatement while WithStatement with DoStatement do IfStatement if else SwitchStatement switch SwitchBody CaseLabel case DefaultLabel TryStatement try CatchClause catch FinallyClause finally ReturnStatement return ThrowStatement throw BreakStatement break ContinueStatement continue DebuggerStatement debugger LabeledStatement ExpressionStatement SingleExpression SingleClassItem",maxTerm:371,context:trackNewline,nodeProps:[["isolate",-8,4,5,13,33,35,48,50,52,""],["group",-26,8,16,18,65,201,205,209,210,212,215,218,228,230,236,238,240,242,245,251,257,259,261,263,265,267,268,"Statement",-32,12,13,28,31,32,38,48,51,52,54,59,67,75,79,81,83,84,106,107,116,117,134,137,139,140,141,142,144,145,164,165,167,"Expression",-23,27,29,33,37,39,41,168,170,172,173,175,176,177,179,180,181,183,184,185,195,197,199,200,"Type",-3,87,99,105,"ClassItem"],["openedBy",22,"<",34,"InterpolationStart",53,"[",57,"{",72,"(",157,"JSXStartCloseTag"],["closedBy",23,">",36,"InterpolationEnd",47,"]",58,"}",73,")",162,"JSXEndTag"]],propSources:[jsHighlight],skippedNodes:[0,4,5,271],repeatNodeCount:37,tokenData:"$Fj(CSR!bOX%ZXY+gYZ-yZ[+g[]%Z]^.c^p%Zpq+gqr/mrs3cst:_tuEruvJSvwLkwx! Yxy!'iyz!(sz{!)}{|!,q|}!.O}!O!,q!O!P!/Y!P!Q!9j!Q!R#8g!R![#:v![!]#Gv!]!^#IS!^!_#J^!_!`#Ns!`!a$#_!a!b$(l!b!c$,k!c!}Er!}#O$-u#O#P$/P#P#Q$4h#Q#R$5r#R#SEr#S#T$7P#T#o$8Z#o#p$<k#p#q$=a#q#r$>q#r#s$?}#s$f%Z$f$g+g$g#BYEr#BY#BZ$AX#BZ$ISEr$IS$I_$AX$I_$I|Er$I|$I}$Dd$I}$JO$Dd$JO$JTEr$JT$JU$AX$JU$KVEr$KV$KW$AX$KW&FUEr&FU&FV$AX&FV;'SEr;'S;=`I|<%l?HTEr?HT?HU$AX?HUOEr(n%d_$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&j&hT$f&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c&j&zP;=`<%l&c'|'U]$f&j(R!bOY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}!b(SU(R!bOY'}Zw'}x#O'}#P;'S'};'S;=`(f<%lO'}!b(iP;=`<%l'}'|(oP;=`<%l&}'[(y]$f&j(OpOY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(rp)wU(OpOY)rZr)rs#O)r#P;'S)r;'S;=`*Z<%lO)rp*^P;=`<%l)r'[*dP;=`<%l(r#S*nX(Op(R!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g#S+^P;=`<%l*g(n+dP;=`<%l%Z(CS+rq$f&j(Op(R!b't(;dOX%ZXY+gYZ&cZ[+g[p%Zpq+gqr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p$f%Z$f$g+g$g#BY%Z#BY#BZ+g#BZ$IS%Z$IS$I_+g$I_$JT%Z$JT$JU+g$JU$KV%Z$KV$KW+g$KW&FU%Z&FU&FV+g&FV;'S%Z;'S;=`+a<%l?HT%Z?HT?HU+g?HUO%Z(CS.ST(P#S$f&j'u(;dO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c(CS.n_$f&j(Op(R!b'u(;dOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#`/x`$f&j!o$Ip(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`0z!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S1V`#t$Id$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`2X!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S2d_#t$Id$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/|3l_'}$(n$f&j(R!bOY4kYZ5qZr4krs7nsw4kwx5qx!^4k!^!_8p!_#O4k#O#P5q#P#o4k#o#p8p#p;'S4k;'S;=`:X<%lO4k(^4r_$f&j(R!bOY4kYZ5qZr4krs7nsw4kwx5qx!^4k!^!_8p!_#O4k#O#P5q#P#o4k#o#p8p#p;'S4k;'S;=`:X<%lO4k&z5vX$f&jOr5qrs6cs!^5q!^!_6y!_#o5q#o#p6y#p;'S5q;'S;=`7h<%lO5q&z6jT$a`$f&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c`6|TOr6yrs7]s;'S6y;'S;=`7b<%lO6y`7bO$a``7eP;=`<%l6y&z7kP;=`<%l5q(^7w]$a`$f&j(R!bOY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}!r8uZ(R!bOY8pYZ6yZr8prs9hsw8pwx6yx#O8p#O#P6y#P;'S8p;'S;=`:R<%lO8p!r9oU$a`(R!bOY'}Zw'}x#O'}#P;'S'};'S;=`(f<%lO'}!r:UP;=`<%l8p(^:[P;=`<%l4k#%|:hh$f&j(Op(R!bOY%ZYZ&cZq%Zqr<Srs&}st%ZtuCruw%Zwx(rx!^%Z!^!_*g!_!c%Z!c!}Cr!}#O%Z#O#P&c#P#R%Z#R#SCr#S#T%Z#T#oCr#o#p*g#p$g%Z$g;'SCr;'S;=`El<%lOCr(r<__VS$f&j(Op(R!bOY<SYZ&cZr<Srs=^sw<Swx@nx!^<S!^!_Bm!_#O<S#O#P>`#P#o<S#o#pBm#p;'S<S;'S;=`Cl<%lO<S(Q=g]VS$f&j(R!bOY=^YZ&cZw=^wx>`x!^=^!^!_?q!_#O=^#O#P>`#P#o=^#o#p?q#p;'S=^;'S;=`@h<%lO=^&n>gXVS$f&jOY>`YZ&cZ!^>`!^!_?S!_#o>`#o#p?S#p;'S>`;'S;=`?k<%lO>`S?XSVSOY?SZ;'S?S;'S;=`?e<%lO?SS?hP;=`<%l?S&n?nP;=`<%l>`!f?xWVS(R!bOY?qZw?qwx?Sx#O?q#O#P?S#P;'S?q;'S;=`@b<%lO?q!f@eP;=`<%l?q(Q@kP;=`<%l=^'`@w]VS$f&j(OpOY@nYZ&cZr@nrs>`s!^@n!^!_Ap!_#O@n#O#P>`#P#o@n#o#pAp#p;'S@n;'S;=`Bg<%lO@ntAwWVS(OpOYApZrAprs?Ss#OAp#O#P?S#P;'SAp;'S;=`Ba<%lOAptBdP;=`<%lAp'`BjP;=`<%l@n#WBvYVS(Op(R!bOYBmZrBmrs?qswBmwxApx#OBm#O#P?S#P;'SBm;'S;=`Cf<%lOBm#WCiP;=`<%lBm(rCoP;=`<%l<S#%|C}i$f&j(g!L^(Op(R!bOY%ZYZ&cZr%Zrs&}st%ZtuCruw%Zwx(rx!Q%Z!Q![Cr![!^%Z!^!_*g!_!c%Z!c!}Cr!}#O%Z#O#P&c#P#R%Z#R#SCr#S#T%Z#T#oCr#o#p*g#p$g%Z$g;'SCr;'S;=`El<%lOCr#%|EoP;=`<%lCr(CSFRk$f&j(Op(R!b$Y#t'{&;d([!LYOY%ZYZ&cZr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$g%Z$g;'SEr;'S;=`I|<%lOEr+dHRk$f&j(Op(R!b$Y#tOY%ZYZ&cZr%Zrs&}st%ZtuGvuw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Gv![!^%Z!^!_*g!_!c%Z!c!}Gv!}#O%Z#O#P&c#P#R%Z#R#SGv#S#T%Z#T#oGv#o#p*g#p$g%Z$g;'SGv;'S;=`Iv<%lOGv+dIyP;=`<%lGv(CSJPP;=`<%lEr%#SJ_`$f&j(Op(R!b#l$IdOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#SKl_$f&j$O$Id(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&COLva(p&;`$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sv%ZvwM{wx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#SNW`$f&j#x$Id(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/|! c_(Q$)`$f&j(OpOY!!bYZ!#hZr!!brs!#hsw!!bwx!$xx!^!!b!^!_!%z!_#O!!b#O#P!#h#P#o!!b#o#p!%z#p;'S!!b;'S;=`!'c<%lO!!b'l!!i_$f&j(OpOY!!bYZ!#hZr!!brs!#hsw!!bwx!$xx!^!!b!^!_!%z!_#O!!b#O#P!#h#P#o!!b#o#p!%z#p;'S!!b;'S;=`!'c<%lO!!b&z!#mX$f&jOw!#hwx6cx!^!#h!^!_!$Y!_#o!#h#o#p!$Y#p;'S!#h;'S;=`!$r<%lO!#h`!$]TOw!$Ywx7]x;'S!$Y;'S;=`!$l<%lO!$Y`!$oP;=`<%l!$Y&z!$uP;=`<%l!#h'l!%R]$a`$f&j(OpOY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(r!Q!&PZ(OpOY!%zYZ!$YZr!%zrs!$Ysw!%zwx!&rx#O!%z#O#P!$Y#P;'S!%z;'S;=`!']<%lO!%z!Q!&yU$a`(OpOY)rZr)rs#O)r#P;'S)r;'S;=`*Z<%lO)r!Q!'`P;=`<%l!%z'l!'fP;=`<%l!!b(*Q!'t_!k(!b$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z!'l!)O_!jM|$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'+h!*[b$f&j(Op(R!b'|#)d#m$IdOY%ZYZ&cZr%Zrs&}sw%Zwx(rxz%Zz{!+d{!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S!+o`$f&j(Op(R!b#j$IdOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&-O!,|`$f&j(Op(R!bn&%`OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&C[!.Z_!Y&;l$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS!/ec$f&j(Op(R!b|'<nOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!0p!P!Q%Z!Q![!3Y![!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z!'d!0ya$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!2O!P!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z!'d!2Z_!XMt$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l!3eg$f&j(Op(R!bo$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!3Y![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S!3Y#S#X%Z#X#Y!4|#Y#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l!5Vg$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx{%Z{|!6n|}%Z}!O!6n!O!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l!6wc$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l!8_c$f&j(Op(R!bo$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![!8S![!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S!8S#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS!9uf$f&j(Op(R!b#k$IdOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpxz!;Zz{#,f{!P!;Z!P!Q#-{!Q!^!;Z!^!_#'Z!_!`#5k!`!a#7Q!a!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z(r!;fb$f&j(Op(R!b!USOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpx!P!;Z!P!Q#%Z!Q!^!;Z!^!_#'Z!_!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z(Q!<w`$f&j(R!b!USOY!<nYZ&cZw!<nwx!=yx!P!<n!P!Q!Eb!Q!^!<n!^!_!GY!_!}!<n!}#O!Ja#O#P!Dj#P#o!<n#o#p!GY#p;'S!<n;'S;=`!Kj<%lO!<n&n!>Q^$f&j!USOY!=yYZ&cZ!P!=y!P!Q!>|!Q!^!=y!^!_!@Y!_!}!=y!}#O!Bw#O#P!Dj#P#o!=y#o#p!@Y#p;'S!=y;'S;=`!E[<%lO!=y&n!?Ta$f&j!USO!^&c!_#Z&c#Z#[!>|#[#]&c#]#^!>|#^#a&c#a#b!>|#b#g&c#g#h!>|#h#i&c#i#j!>|#j#m&c#m#n!>|#n#o&c#p;'S&c;'S;=`&w<%lO&cS!@_X!USOY!@YZ!P!@Y!P!Q!@z!Q!}!@Y!}#O!Ac#O#P!Bb#P;'S!@Y;'S;=`!Bq<%lO!@YS!APU!US#Z#[!@z#]#^!@z#a#b!@z#g#h!@z#i#j!@z#m#n!@zS!AfVOY!AcZ#O!Ac#O#P!A{#P#Q!@Y#Q;'S!Ac;'S;=`!B[<%lO!AcS!BOSOY!AcZ;'S!Ac;'S;=`!B[<%lO!AcS!B_P;=`<%l!AcS!BeSOY!@YZ;'S!@Y;'S;=`!Bq<%lO!@YS!BtP;=`<%l!@Y&n!B|[$f&jOY!BwYZ&cZ!^!Bw!^!_!Ac!_#O!Bw#O#P!Cr#P#Q!=y#Q#o!Bw#o#p!Ac#p;'S!Bw;'S;=`!Dd<%lO!Bw&n!CwX$f&jOY!BwYZ&cZ!^!Bw!^!_!Ac!_#o!Bw#o#p!Ac#p;'S!Bw;'S;=`!Dd<%lO!Bw&n!DgP;=`<%l!Bw&n!DoX$f&jOY!=yYZ&cZ!^!=y!^!_!@Y!_#o!=y#o#p!@Y#p;'S!=y;'S;=`!E[<%lO!=y&n!E_P;=`<%l!=y(Q!Eki$f&j(R!b!USOY&}YZ&cZw&}wx&cx!^&}!^!_'}!_#O&}#O#P&c#P#Z&}#Z#[!Eb#[#]&}#]#^!Eb#^#a&}#a#b!Eb#b#g&}#g#h!Eb#h#i&}#i#j!Eb#j#m&}#m#n!Eb#n#o&}#o#p'}#p;'S&};'S;=`(l<%lO&}!f!GaZ(R!b!USOY!GYZw!GYwx!@Yx!P!GY!P!Q!HS!Q!}!GY!}#O!Ic#O#P!Bb#P;'S!GY;'S;=`!JZ<%lO!GY!f!HZb(R!b!USOY'}Zw'}x#O'}#P#Z'}#Z#[!HS#[#]'}#]#^!HS#^#a'}#a#b!HS#b#g'}#g#h!HS#h#i'}#i#j!HS#j#m'}#m#n!HS#n;'S'};'S;=`(f<%lO'}!f!IhX(R!bOY!IcZw!Icwx!Acx#O!Ic#O#P!A{#P#Q!GY#Q;'S!Ic;'S;=`!JT<%lO!Ic!f!JWP;=`<%l!Ic!f!J^P;=`<%l!GY(Q!Jh^$f&j(R!bOY!JaYZ&cZw!Jawx!Bwx!^!Ja!^!_!Ic!_#O!Ja#O#P!Cr#P#Q!<n#Q#o!Ja#o#p!Ic#p;'S!Ja;'S;=`!Kd<%lO!Ja(Q!KgP;=`<%l!Ja(Q!KmP;=`<%l!<n'`!Ky`$f&j(Op!USOY!KpYZ&cZr!Kprs!=ys!P!Kp!P!Q!L{!Q!^!Kp!^!_!Ns!_!}!Kp!}#O##z#O#P!Dj#P#o!Kp#o#p!Ns#p;'S!Kp;'S;=`#%T<%lO!Kp'`!MUi$f&j(Op!USOY(rYZ&cZr(rrs&cs!^(r!^!_)r!_#O(r#O#P&c#P#Z(r#Z#[!L{#[#](r#]#^!L{#^#a(r#a#b!L{#b#g(r#g#h!L{#h#i(r#i#j!L{#j#m(r#m#n!L{#n#o(r#o#p)r#p;'S(r;'S;=`*a<%lO(rt!NzZ(Op!USOY!NsZr!Nsrs!@Ys!P!Ns!P!Q# m!Q!}!Ns!}#O#!|#O#P!Bb#P;'S!Ns;'S;=`##t<%lO!Nst# tb(Op!USOY)rZr)rs#O)r#P#Z)r#Z#[# m#[#])r#]#^# m#^#a)r#a#b# m#b#g)r#g#h# m#h#i)r#i#j# m#j#m)r#m#n# m#n;'S)r;'S;=`*Z<%lO)rt##RX(OpOY#!|Zr#!|rs!Acs#O#!|#O#P!A{#P#Q!Ns#Q;'S#!|;'S;=`##n<%lO#!|t##qP;=`<%l#!|t##wP;=`<%l!Ns'`#$R^$f&j(OpOY##zYZ&cZr##zrs!Bws!^##z!^!_#!|!_#O##z#O#P!Cr#P#Q!Kp#Q#o##z#o#p#!|#p;'S##z;'S;=`#$}<%lO##z'`#%QP;=`<%l##z'`#%WP;=`<%l!Kp(r#%fk$f&j(Op(R!b!USOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#Z%Z#Z#[#%Z#[#]%Z#]#^#%Z#^#a%Z#a#b#%Z#b#g%Z#g#h#%Z#h#i%Z#i#j#%Z#j#m%Z#m#n#%Z#n#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z#W#'d](Op(R!b!USOY#'ZZr#'Zrs!GYsw#'Zwx!Nsx!P#'Z!P!Q#(]!Q!}#'Z!}#O#)w#O#P!Bb#P;'S#'Z;'S;=`#*w<%lO#'Z#W#(fe(Op(R!b!USOY*gZr*grs'}sw*gwx)rx#O*g#P#Z*g#Z#[#(]#[#]*g#]#^#(]#^#a*g#a#b#(]#b#g*g#g#h#(]#h#i*g#i#j#(]#j#m*g#m#n#(]#n;'S*g;'S;=`+Z<%lO*g#W#*OZ(Op(R!bOY#)wZr#)wrs!Icsw#)wwx#!|x#O#)w#O#P!A{#P#Q#'Z#Q;'S#)w;'S;=`#*q<%lO#)w#W#*tP;=`<%l#)w#W#*zP;=`<%l#'Z(r#+W`$f&j(Op(R!bOY#*}YZ&cZr#*}rs!Jasw#*}wx##zx!^#*}!^!_#)w!_#O#*}#O#P!Cr#P#Q!;Z#Q#o#*}#o#p#)w#p;'S#*};'S;=`#,Y<%lO#*}(r#,]P;=`<%l#*}(r#,cP;=`<%l!;Z(CS#,sb$f&j(Op(R!b'v(;d!USOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpx!P!;Z!P!Q#%Z!Q!^!;Z!^!_#'Z!_!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z(CS#.W_$f&j(Op(R!bS(;dOY#-{YZ&cZr#-{rs#/Vsw#-{wx#2gx!^#-{!^!_#4f!_#O#-{#O#P#0X#P#o#-{#o#p#4f#p;'S#-{;'S;=`#5e<%lO#-{(Bb#/`]$f&j(R!bS(;dOY#/VYZ&cZw#/Vwx#0Xx!^#/V!^!_#1j!_#O#/V#O#P#0X#P#o#/V#o#p#1j#p;'S#/V;'S;=`#2a<%lO#/V(AO#0`X$f&jS(;dOY#0XYZ&cZ!^#0X!^!_#0{!_#o#0X#o#p#0{#p;'S#0X;'S;=`#1d<%lO#0X(;d#1QSS(;dOY#0{Z;'S#0{;'S;=`#1^<%lO#0{(;d#1aP;=`<%l#0{(AO#1gP;=`<%l#0X(<v#1qW(R!bS(;dOY#1jZw#1jwx#0{x#O#1j#O#P#0{#P;'S#1j;'S;=`#2Z<%lO#1j(<v#2^P;=`<%l#1j(Bb#2dP;=`<%l#/V(Ap#2p]$f&j(OpS(;dOY#2gYZ&cZr#2grs#0Xs!^#2g!^!_#3i!_#O#2g#O#P#0X#P#o#2g#o#p#3i#p;'S#2g;'S;=`#4`<%lO#2g(<U#3pW(OpS(;dOY#3iZr#3irs#0{s#O#3i#O#P#0{#P;'S#3i;'S;=`#4Y<%lO#3i(<U#4]P;=`<%l#3i(Ap#4cP;=`<%l#2g(=h#4oY(Op(R!bS(;dOY#4fZr#4frs#1jsw#4fwx#3ix#O#4f#O#P#0{#P;'S#4f;'S;=`#5_<%lO#4f(=h#5bP;=`<%l#4f(CS#5hP;=`<%l#-{%#W#5xb$f&j$O$Id(Op(R!b!USOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpx!P!;Z!P!Q#%Z!Q!^!;Z!^!_#'Z!_!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z+h#7_b$W#t$f&j(Op(R!b!USOY!;ZYZ&cZr!;Zrs!<nsw!;Zwx!Kpx!P!;Z!P!Q#%Z!Q!^!;Z!^!_#'Z!_!}!;Z!}#O#*}#O#P!Dj#P#o!;Z#o#p#'Z#p;'S!;Z;'S;=`#,`<%lO!;Z$/l#8rp$f&j(Op(R!bo$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!3Y!P!Q%Z!Q![#:v![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S#:v#S#U%Z#U#V#>Q#V#X%Z#X#Y!4|#Y#b%Z#b#c#<v#c#d#AY#d#l%Z#l#m#D[#m#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#;Rk$f&j(Op(R!bo$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P!3Y!P!Q%Z!Q![#:v![!^%Z!^!_*g!_!g%Z!g!h!4|!h#O%Z#O#P&c#P#R%Z#R#S#:v#S#X%Z#X#Y!4|#Y#b%Z#b#c#<v#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#=R_$f&j(Op(R!bo$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#>Zd$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!R#?i!R!S#?i!S!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#?i#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#?tf$f&j(Op(R!bo$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!R#?i!R!S#?i!S!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#?i#S#b%Z#b#c#<v#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#Acc$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!Y#Bn!Y!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#Bn#S#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#Bye$f&j(Op(R!bo$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q!Y#Bn!Y!^%Z!^!_*g!_#O%Z#O#P&c#P#R%Z#R#S#Bn#S#b%Z#b#c#<v#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#Deg$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![#E|![!^%Z!^!_*g!_!c%Z!c!i#E|!i#O%Z#O#P&c#P#R%Z#R#S#E|#S#T%Z#T#Z#E|#Z#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z$/l#FXi$f&j(Op(R!bo$'|OY%ZYZ&cZr%Zrs&}sw%Zwx(rx!Q%Z!Q![#E|![!^%Z!^!_*g!_!c%Z!c!i#E|!i#O%Z#O#P&c#P#R%Z#R#S#E|#S#T%Z#T#Z#E|#Z#b%Z#b#c#<v#c#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%Gh#HT_!d$b$f&j#|%<f(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z)[#I__`l$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(@^#Jk^g!*v!h'.r(Op(R!b(tSOY*gZr*grs'}sw*gwx)rx!P*g!P!Q#Kg!Q!^*g!^!_#L]!_!`#M}!`#O*g#P;'S*g;'S;=`+Z<%lO*g(n#KpX$h&j(Op(R!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g$Kh#LfZ#n$Id(Op(R!bOY*gZr*grs'}sw*gwx)rx!_*g!_!`#MX!`#O*g#P;'S*g;'S;=`+Z<%lO*g$Kh#MbX$O$Id(Op(R!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g$Kh#NWX#o$Id(Op(R!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g%Gh$ Oa#[%?x$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`0z!`!a$!T!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#W$!`_#g$Ih$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%Gh$#nafBf#o$Id$c#|$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`$$s!`!a$%}!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$%O_#o$Id$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$&Ya#n$Id$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`!a$'_!a#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$'j`#n$Id$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'+h$(wc(h$Ip$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!O%Z!O!P$*S!P!^%Z!^!_*g!_!a%Z!a!b$+^!b#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z'+`$*__}'#p$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$+i`$f&j#y$Id(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z#&^$,v_!{!Ln$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(@^$.Q_!P(8n$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(n$/UZ$f&jO!^$/w!^!_$0_!_#i$/w#i#j$0d#j#l$/w#l#m$2V#m#o$/w#o#p$0_#p;'S$/w;'S;=`$4b<%lO$/w(n$0OT^#S$f&jO!^&c!_#o&c#p;'S&c;'S;=`&w<%lO&c#S$0dO^#S(n$0i[$f&jO!Q&c!Q![$1_![!^&c!_!c&c!c!i$1_!i#T&c#T#Z$1_#Z#o&c#o#p$3u#p;'S&c;'S;=`&w<%lO&c(n$1dZ$f&jO!Q&c!Q![$2V![!^&c!_!c&c!c!i$2V!i#T&c#T#Z$2V#Z#o&c#p;'S&c;'S;=`&w<%lO&c(n$2[Z$f&jO!Q&c!Q![$2}![!^&c!_!c&c!c!i$2}!i#T&c#T#Z$2}#Z#o&c#p;'S&c;'S;=`&w<%lO&c(n$3SZ$f&jO!Q&c!Q![$/w![!^&c!_!c&c!c!i$/w!i#T&c#T#Z$/w#Z#o&c#p;'S&c;'S;=`&w<%lO&c#S$3xR!Q![$4R!c!i$4R#T#Z$4R#S$4US!Q![$4R!c!i$4R#T#Z$4R#q#r$0_(n$4eP;=`<%l$/w!2r$4s_!V!+S$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z%#S$5}`#v$Id$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z&,v$7[_$f&j(Op(R!b(X&%WOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS$8jk$f&j(Op(R!b'{&;d$[#t([!LYOY%ZYZ&cZr%Zrs&}st%Ztu$8Zuw%Zwx(rx}%Z}!O$:_!O!Q%Z!Q![$8Z![!^%Z!^!_*g!_!c%Z!c!}$8Z!}#O%Z#O#P&c#P#R%Z#R#S$8Z#S#T%Z#T#o$8Z#o#p*g#p$g%Z$g;'S$8Z;'S;=`$<e<%lO$8Z+d$:jk$f&j(Op(R!b$[#tOY%ZYZ&cZr%Zrs&}st%Ztu$:_uw%Zwx(rx}%Z}!O$:_!O!Q%Z!Q![$:_![!^%Z!^!_*g!_!c%Z!c!}$:_!}#O%Z#O#P&c#P#R%Z#R#S$:_#S#T%Z#T#o$:_#o#p*g#p$g%Z$g;'S$:_;'S;=`$<_<%lO$:_+d$<bP;=`<%l$:_(CS$<hP;=`<%l$8Z!5p$<tX![!3l(Op(R!bOY*gZr*grs'}sw*gwx)rx#O*g#P;'S*g;'S;=`+Z<%lO*g&CO$=la(o&;`$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_!`Ka!`#O%Z#O#P&c#P#o%Z#o#p*g#p#q$+^#q;'S%Z;'S;=`+a<%lO%Z%#`$?O_!Z$I`r`$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(r$@Y_!pS$f&j(Op(R!bOY%ZYZ&cZr%Zrs&}sw%Zwx(rx!^%Z!^!_*g!_#O%Z#O#P&c#P#o%Z#o#p*g#p;'S%Z;'S;=`+a<%lO%Z(CS$Aj|$f&j(Op(R!b't(;d$Y#t'{&;d([!LYOX%ZXY+gYZ&cZ[+g[p%Zpq+gqr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$f%Z$f$g+g$g#BYEr#BY#BZ$AX#BZ$ISEr$IS$I_$AX$I_$JTEr$JT$JU$AX$JU$KVEr$KV$KW$AX$KW&FUEr&FU&FV$AX&FV;'SEr;'S;=`I|<%l?HTEr?HT?HU$AX?HUOEr(CS$Duk$f&j(Op(R!b'u(;d$Y#t'{&;d([!LYOY%ZYZ&cZr%Zrs&}st%ZtuEruw%Zwx(rx}%Z}!OGv!O!Q%Z!Q![Er![!^%Z!^!_*g!_!c%Z!c!}Er!}#O%Z#O#P&c#P#R%Z#R#SEr#S#T%Z#T#oEr#o#p*g#p$g%Z$g;'SEr;'S;=`I|<%lOEr",tokenizers:[noSemicolon,incdecToken,jsx,2,3,4,5,6,7,8,9,10,11,12,13,insertSemicolon,new LocalTokenGroup("$S~RRtu[#O#Pg#S#T#|~_P#o#pb~gOt~~jVO#i!P#i#j!U#j#l!P#l#m!q#m;'S!P;'S;=`#v<%lO!P~!UO!R~~!XS!Q![!e!c!i!e#T#Z!e#o#p#Z~!hR!Q![!q!c!i!q#T#Z!q~!tR!Q![!}!c!i!}#T#Z!}~#QR!Q![!P!c!i!P#T#Z!P~#^R!Q![#g!c!i#g#T#Z#g~#jS!Q![#g!c!i#g#T#Z#g#q#r!P~#yP;=`<%l!P~$RO(Z~~",141,332),new LocalTokenGroup("j~RQYZXz{^~^O'x~~aP!P!Qd~iO'y~~",25,315)],topRules:{"Script":[0,6],"SingleExpression":[1,269],"SingleClassItem":[2,270]},dialects:{jsx:0,ts:14614},dynamicPrecedences:{"69":1,"79":1,"81":1,"165":1,"193":1},specialized:[{term:319,get:value=>spec_identifier[value]||-1},{term:334,get:value=>spec_word[value]||-1},{term:70,get:value=>spec_LessThan[value]||-1}],tokenPrec:14638});/**
  A collection of JavaScript-related
  [snippets](https://codemirror.net/6/docs/ref/#autocomplete.snippet).
  */const snippets=[/*@__PURE__*/snippetCompletion("function ${name}(${params}) {\n\t${}\n}",{label:"function",detail:"definition",type:"keyword"}),/*@__PURE__*/snippetCompletion("for (let ${index} = 0; ${index} < ${bound}; ${index}++) {\n\t${}\n}",{label:"for",detail:"loop",type:"keyword"}),/*@__PURE__*/snippetCompletion("for (let ${name} of ${collection}) {\n\t${}\n}",{label:"for",detail:"of loop",type:"keyword"}),/*@__PURE__*/snippetCompletion("do {\n\t${}\n} while (${})",{label:"do",detail:"loop",type:"keyword"}),/*@__PURE__*/snippetCompletion("while (${}) {\n\t${}\n}",{label:"while",detail:"loop",type:"keyword"}),/*@__PURE__*/snippetCompletion("try {\n\t${}\n} catch (${error}) {\n\t${}\n}",{label:"try",detail:"/ catch block",type:"keyword"}),/*@__PURE__*/snippetCompletion("if (${}) {\n\t${}\n}",{label:"if",detail:"block",type:"keyword"}),/*@__PURE__*/snippetCompletion("if (${}) {\n\t${}\n} else {\n\t${}\n}",{label:"if",detail:"/ else block",type:"keyword"}),/*@__PURE__*/snippetCompletion("class ${name} {\n\tconstructor(${params}) {\n\t\t${}\n\t}\n}",{label:"class",detail:"definition",type:"keyword"}),/*@__PURE__*/snippetCompletion("import {${names}} from \"${module}\"\n${}",{label:"import",detail:"named",type:"keyword"}),/*@__PURE__*/snippetCompletion("import ${name} from \"${module}\"\n${}",{label:"import",detail:"default",type:"keyword"})];/**
  A collection of snippet completions for TypeScript. Includes the
  JavaScript [snippets](https://codemirror.net/6/docs/ref/#lang-javascript.snippets).
  */const typescriptSnippets=/*@__PURE__*/snippets.concat([/*@__PURE__*/snippetCompletion("interface ${name} {\n\t${}\n}",{label:"interface",detail:"definition",type:"keyword"}),/*@__PURE__*/snippetCompletion("type ${name} = ${type}",{label:"type",detail:"definition",type:"keyword"}),/*@__PURE__*/snippetCompletion("enum ${name} {\n\t${}\n}",{label:"enum",detail:"definition",type:"keyword"})]);const cache=/*@__PURE__*/new NodeWeakMap();const ScopeNodes=/*@__PURE__*/new Set(["Script","Block","FunctionExpression","FunctionDeclaration","ArrowFunction","MethodDeclaration","ForStatement"]);function defID(type){return(node,def)=>{let id=node.node.getChild("VariableDefinition");if(id)def(id,type);return true;};}const functionContext=["FunctionDeclaration"];const gatherCompletions={FunctionDeclaration:/*@__PURE__*/defID("function"),ClassDeclaration:/*@__PURE__*/defID("class"),ClassExpression:()=>true,EnumDeclaration:/*@__PURE__*/defID("constant"),TypeAliasDeclaration:/*@__PURE__*/defID("type"),NamespaceDeclaration:/*@__PURE__*/defID("namespace"),VariableDefinition(node,def){if(!node.matchContext(functionContext))def(node,"variable");},TypeDefinition(node,def){def(node,"type");},__proto__:null};function getScope(doc,node){let cached=cache.get(node);if(cached)return cached;let completions=[],top=true;function def(node,type){let name=doc.sliceString(node.from,node.to);completions.push({label:name,type});}node.cursor(IterMode.IncludeAnonymous).iterate(node=>{if(top){top=false;}else if(node.name){let gather=gatherCompletions[node.name];if(gather&&gather(node,def)||ScopeNodes.has(node.name))return false;}else if(node.to-node.from>8192){// Allow caching for bigger internal nodes
for(let c of getScope(doc,node.node))completions.push(c);return false;}});cache.set(node,completions);return completions;}const Identifier=/^[\w$\xa1-\uffff][\w$\d\xa1-\uffff]*$/;const dontComplete=["TemplateString","String","RegExp","LineComment","BlockComment","VariableDefinition","TypeDefinition","Label","PropertyDefinition","PropertyName","PrivatePropertyDefinition","PrivatePropertyName",".","?."];/**
  Completion source that looks up locally defined names in
  JavaScript code.
  */function localCompletionSource(context){let inner=syntaxTree(context.state).resolveInner(context.pos,-1);if(dontComplete.indexOf(inner.name)>-1)return null;let isWord=inner.name=="VariableName"||inner.to-inner.from<20&&Identifier.test(context.state.sliceDoc(inner.from,inner.to));if(!isWord&&!context.explicit)return null;let options=[];for(let pos=inner;pos;pos=pos.parent){if(ScopeNodes.has(pos.name))options=options.concat(getScope(context.state.doc,pos));}return{options,from:isWord?inner.from:context.pos,validFor:Identifier};}/**
  A language provider based on the [Lezer JavaScript
  parser](https://github.com/lezer-parser/javascript), extended with
  highlighting and indentation information.
  */const javascriptLanguage=/*@__PURE__*/LRLanguage.define({name:"javascript",parser:/*@__PURE__*/parser.configure({props:[/*@__PURE__*/indentNodeProp.add({IfStatement:/*@__PURE__*/continuedIndent({except:/^\s*({|else\b)/}),TryStatement:/*@__PURE__*/continuedIndent({except:/^\s*({|catch\b|finally\b)/}),LabeledStatement:flatIndent,SwitchBody:context=>{let after=context.textAfter,closed=/^\s*\}/.test(after),isCase=/^\s*(case|default)\b/.test(after);return context.baseIndent+(closed?0:isCase?1:2)*context.unit;},Block:/*@__PURE__*/delimitedIndent({closing:"}"}),ArrowFunction:cx=>cx.baseIndent+cx.unit,"TemplateString BlockComment":()=>null,"Statement Property":/*@__PURE__*/continuedIndent({except:/^{/}),JSXElement(context){let closed=/^\s*<\//.test(context.textAfter);return context.lineIndent(context.node.from)+(closed?0:context.unit);},JSXEscape(context){let closed=/\s*\}/.test(context.textAfter);return context.lineIndent(context.node.from)+(closed?0:context.unit);},"JSXOpenTag JSXSelfClosingTag"(context){return context.column(context.node.from)+context.unit;}}),/*@__PURE__*/foldNodeProp.add({"Block ClassBody SwitchBody EnumBody ObjectExpression ArrayExpression ObjectType":foldInside,BlockComment(tree){return{from:tree.from+2,to:tree.to-2};}})]}),languageData:{closeBrackets:{brackets:["(","[","{","'",'"',"`"]},commentTokens:{line:"//",block:{open:"/*",close:"*/"}},indentOnInput:/^\s*(?:case |default:|\{|\}|<\/)$/,wordChars:"$"}});const jsxSublanguage={test:node=>/^JSX/.test(node.name),facet:/*@__PURE__*/defineLanguageFacet({commentTokens:{block:{open:"{/*",close:"*/}"}}})};/**
  A language provider for TypeScript.
  */const typescriptLanguage=/*@__PURE__*/javascriptLanguage.configure({dialect:"ts"},"typescript");/**
  Language provider for JSX.
  */const jsxLanguage=/*@__PURE__*/javascriptLanguage.configure({dialect:"jsx",props:[/*@__PURE__*/sublanguageProp.add(n=>n.isTop?[jsxSublanguage]:undefined)]});/**
  Language provider for JSX + TypeScript.
  */const tsxLanguage=/*@__PURE__*/javascriptLanguage.configure({dialect:"jsx ts",props:[/*@__PURE__*/sublanguageProp.add(n=>n.isTop?[jsxSublanguage]:undefined)]},"typescript");let kwCompletion=name=>({label:name,type:"keyword"});const keywords=/*@__PURE__*/"break case const continue default delete export extends false finally in instanceof let new return static super switch this throw true typeof var yield".split(" ").map(kwCompletion);const typescriptKeywords=/*@__PURE__*/keywords.concat(/*@__PURE__*/["declare","implements","private","protected","public"].map(kwCompletion));/**
  JavaScript support. Includes [snippet](https://codemirror.net/6/docs/ref/#lang-javascript.snippets)
  and local variable completion.
  */function javascript(config={}){let lang=config.jsx?config.typescript?tsxLanguage:jsxLanguage:config.typescript?typescriptLanguage:javascriptLanguage;let completions=config.typescript?typescriptSnippets.concat(typescriptKeywords):snippets.concat(keywords);return new LanguageSupport(lang,[javascriptLanguage.data.of({autocomplete:ifNotIn(dontComplete,completeFromList(completions))}),javascriptLanguage.data.of({autocomplete:localCompletionSource}),config.jsx?autoCloseTags$1:[]]);}function findOpenTag(node){for(;;){if(node.name=="JSXOpenTag"||node.name=="JSXSelfClosingTag"||node.name=="JSXFragmentTag")return node;if(node.name=="JSXEscape"||!node.parent)return null;node=node.parent;}}function elementName$1(doc,tree,max=doc.length){for(let ch=tree===null||tree===void 0?void 0:tree.firstChild;ch;ch=ch.nextSibling){if(ch.name=="JSXIdentifier"||ch.name=="JSXBuiltin"||ch.name=="JSXNamespacedName"||ch.name=="JSXMemberExpression")return doc.sliceString(ch.from,Math.min(ch.to,max));}return"";}const android=typeof navigator=="object"&&/*@__PURE__*/ /Android\b/.test(navigator.userAgent);/**
  Extension that will automatically insert JSX close tags when a `>` or
  `/` is typed.
  */const autoCloseTags$1=/*@__PURE__*/EditorView.inputHandler.of((view,from,to,text,defaultInsert)=>{if((android?view.composing:view.compositionStarted)||view.state.readOnly||from!=to||text!=">"&&text!="/"||!javascriptLanguage.isActiveAt(view.state,from,-1))return false;let base=defaultInsert(),{state}=base;let closeTags=state.changeByRange(range=>{var _a;let{head}=range,around=syntaxTree(state).resolveInner(head-1,-1),name;if(around.name=="JSXStartTag")around=around.parent;if(state.doc.sliceString(head-1,head)!=text||around.name=="JSXAttributeValue"&&around.to>head);else if(text==">"&&around.name=="JSXFragmentTag"){return{range,changes:{from:head,insert:`</>`}};}else if(text=="/"&&around.name=="JSXStartCloseTag"){let empty=around.parent,base=empty.parent;if(base&&empty.from==head-2&&((name=elementName$1(state.doc,base.firstChild,head))||((_a=base.firstChild)===null||_a===void 0?void 0:_a.name)=="JSXFragmentTag")){let insert=`${name}>`;return{range:EditorSelection.cursor(head+insert.length,-1),changes:{from:head,insert}};}}else if(text==">"){let openTag=findOpenTag(around);if(openTag&&openTag.name=="JSXOpenTag"&&!/^\/?>|^<\//.test(state.doc.sliceString(head,head+2))&&(name=elementName$1(state.doc,openTag,head)))return{range,changes:{from:head,insert:`</${name}>`}};}return{range};});if(closeTags.changes.empty)return false;view.dispatch([base,state.update(closeTags,{userEvent:"input.complete",scrollIntoView:true})]);return true;});const Targets=["_blank","_self","_top","_parent"];const Charsets=["ascii","utf-8","utf-16","latin1","latin1"];const Methods=["get","post","put","delete"];const Encs=["application/x-www-form-urlencoded","multipart/form-data","text/plain"];const Bool=["true","false"];const S={};// Empty tag spec
const Tags={a:{attrs:{href:null,ping:null,type:null,media:null,target:Targets,hreflang:null}},abbr:S,address:S,area:{attrs:{alt:null,coords:null,href:null,target:null,ping:null,media:null,hreflang:null,type:null,shape:["default","rect","circle","poly"]}},article:S,aside:S,audio:{attrs:{src:null,mediagroup:null,crossorigin:["anonymous","use-credentials"],preload:["none","metadata","auto"],autoplay:["autoplay"],loop:["loop"],controls:["controls"]}},b:S,base:{attrs:{href:null,target:Targets}},bdi:S,bdo:S,blockquote:{attrs:{cite:null}},body:S,br:S,button:{attrs:{form:null,formaction:null,name:null,value:null,autofocus:["autofocus"],disabled:["autofocus"],formenctype:Encs,formmethod:Methods,formnovalidate:["novalidate"],formtarget:Targets,type:["submit","reset","button"]}},canvas:{attrs:{width:null,height:null}},caption:S,center:S,cite:S,code:S,col:{attrs:{span:null}},colgroup:{attrs:{span:null}},command:{attrs:{type:["command","checkbox","radio"],label:null,icon:null,radiogroup:null,command:null,title:null,disabled:["disabled"],checked:["checked"]}},data:{attrs:{value:null}},datagrid:{attrs:{disabled:["disabled"],multiple:["multiple"]}},datalist:{attrs:{data:null}},dd:S,del:{attrs:{cite:null,datetime:null}},details:{attrs:{open:["open"]}},dfn:S,div:S,dl:S,dt:S,em:S,embed:{attrs:{src:null,type:null,width:null,height:null}},eventsource:{attrs:{src:null}},fieldset:{attrs:{disabled:["disabled"],form:null,name:null}},figcaption:S,figure:S,footer:S,form:{attrs:{action:null,name:null,"accept-charset":Charsets,autocomplete:["on","off"],enctype:Encs,method:Methods,novalidate:["novalidate"],target:Targets}},h1:S,h2:S,h3:S,h4:S,h5:S,h6:S,head:{children:["title","base","link","style","meta","script","noscript","command"]},header:S,hgroup:S,hr:S,html:{attrs:{manifest:null}},i:S,iframe:{attrs:{src:null,srcdoc:null,name:null,width:null,height:null,sandbox:["allow-top-navigation","allow-same-origin","allow-forms","allow-scripts"],seamless:["seamless"]}},img:{attrs:{alt:null,src:null,ismap:null,usemap:null,width:null,height:null,crossorigin:["anonymous","use-credentials"]}},input:{attrs:{alt:null,dirname:null,form:null,formaction:null,height:null,list:null,max:null,maxlength:null,min:null,name:null,pattern:null,placeholder:null,size:null,src:null,step:null,value:null,width:null,accept:["audio/*","video/*","image/*"],autocomplete:["on","off"],autofocus:["autofocus"],checked:["checked"],disabled:["disabled"],formenctype:Encs,formmethod:Methods,formnovalidate:["novalidate"],formtarget:Targets,multiple:["multiple"],readonly:["readonly"],required:["required"],type:["hidden","text","search","tel","url","email","password","datetime","date","month","week","time","datetime-local","number","range","color","checkbox","radio","file","submit","image","reset","button"]}},ins:{attrs:{cite:null,datetime:null}},kbd:S,keygen:{attrs:{challenge:null,form:null,name:null,autofocus:["autofocus"],disabled:["disabled"],keytype:["RSA"]}},label:{attrs:{for:null,form:null}},legend:S,li:{attrs:{value:null}},link:{attrs:{href:null,type:null,hreflang:null,media:null,sizes:["all","16x16","16x16 32x32","16x16 32x32 64x64"]}},map:{attrs:{name:null}},mark:S,menu:{attrs:{label:null,type:["list","context","toolbar"]}},meta:{attrs:{content:null,charset:Charsets,name:["viewport","application-name","author","description","generator","keywords"],"http-equiv":["content-language","content-type","default-style","refresh"]}},meter:{attrs:{value:null,min:null,low:null,high:null,max:null,optimum:null}},nav:S,noscript:S,object:{attrs:{data:null,type:null,name:null,usemap:null,form:null,width:null,height:null,typemustmatch:["typemustmatch"]}},ol:{attrs:{reversed:["reversed"],start:null,type:["1","a","A","i","I"]},children:["li","script","template","ul","ol"]},optgroup:{attrs:{disabled:["disabled"],label:null}},option:{attrs:{disabled:["disabled"],label:null,selected:["selected"],value:null}},output:{attrs:{for:null,form:null,name:null}},p:S,param:{attrs:{name:null,value:null}},pre:S,progress:{attrs:{value:null,max:null}},q:{attrs:{cite:null}},rp:S,rt:S,ruby:S,samp:S,script:{attrs:{type:["text/javascript"],src:null,async:["async"],defer:["defer"],charset:Charsets}},section:S,select:{attrs:{form:null,name:null,size:null,autofocus:["autofocus"],disabled:["disabled"],multiple:["multiple"]}},slot:{attrs:{name:null}},small:S,source:{attrs:{src:null,type:null,media:null}},span:S,strong:S,style:{attrs:{type:["text/css"],media:null,scoped:null}},sub:S,summary:S,sup:S,table:S,tbody:S,td:{attrs:{colspan:null,rowspan:null,headers:null}},template:S,textarea:{attrs:{dirname:null,form:null,maxlength:null,name:null,placeholder:null,rows:null,cols:null,autofocus:["autofocus"],disabled:["disabled"],readonly:["readonly"],required:["required"],wrap:["soft","hard"]}},tfoot:S,th:{attrs:{colspan:null,rowspan:null,headers:null,scope:["row","col","rowgroup","colgroup"]}},thead:S,time:{attrs:{datetime:null}},title:S,tr:S,track:{attrs:{src:null,label:null,default:null,kind:["subtitles","captions","descriptions","chapters","metadata"],srclang:null}},ul:{children:["li","script","template","ul","ol"]},var:S,video:{attrs:{src:null,poster:null,width:null,height:null,crossorigin:["anonymous","use-credentials"],preload:["auto","metadata","none"],autoplay:["autoplay"],mediagroup:["movie"],muted:["muted"],controls:["controls"]}},wbr:S};const GlobalAttrs={accesskey:null,class:null,contenteditable:Bool,contextmenu:null,dir:["ltr","rtl","auto"],draggable:["true","false","auto"],dropzone:["copy","move","link","string:","file:"],hidden:["hidden"],id:null,inert:["inert"],itemid:null,itemprop:null,itemref:null,itemscope:["itemscope"],itemtype:null,lang:["ar","bn","de","en-GB","en-US","es","fr","hi","id","ja","pa","pt","ru","tr","zh"],spellcheck:Bool,autocorrect:Bool,autocapitalize:Bool,style:null,tabindex:null,title:null,translate:["yes","no"],rel:["stylesheet","alternate","author","bookmark","help","license","next","nofollow","noreferrer","prefetch","prev","search","tag"],role:/*@__PURE__*/"alert application article banner button cell checkbox complementary contentinfo dialog document feed figure form grid gridcell heading img list listbox listitem main navigation region row rowgroup search switch tab table tabpanel textbox timer".split(" "),"aria-activedescendant":null,"aria-atomic":Bool,"aria-autocomplete":["inline","list","both","none"],"aria-busy":Bool,"aria-checked":["true","false","mixed","undefined"],"aria-controls":null,"aria-describedby":null,"aria-disabled":Bool,"aria-dropeffect":null,"aria-expanded":["true","false","undefined"],"aria-flowto":null,"aria-grabbed":["true","false","undefined"],"aria-haspopup":Bool,"aria-hidden":Bool,"aria-invalid":["true","false","grammar","spelling"],"aria-label":null,"aria-labelledby":null,"aria-level":null,"aria-live":["off","polite","assertive"],"aria-multiline":Bool,"aria-multiselectable":Bool,"aria-owns":null,"aria-posinset":null,"aria-pressed":["true","false","mixed","undefined"],"aria-readonly":Bool,"aria-relevant":null,"aria-required":Bool,"aria-selected":["true","false","undefined"],"aria-setsize":null,"aria-sort":["ascending","descending","none","other"],"aria-valuemax":null,"aria-valuemin":null,"aria-valuenow":null,"aria-valuetext":null};const eventAttributes=/*@__PURE__*/("beforeunload copy cut dragstart dragover dragleave dragenter dragend "+"drag paste focus blur change click load mousedown mouseenter mouseleave "+"mouseup keydown keyup resize scroll unload").split(" ").map(n=>"on"+n);for(let a of eventAttributes)GlobalAttrs[a]=null;class Schema{constructor(extraTags,extraAttrs){this.tags=Object.assign(Object.assign({},Tags),extraTags);this.globalAttrs=Object.assign(Object.assign({},GlobalAttrs),extraAttrs);this.allTags=Object.keys(this.tags);this.globalAttrNames=Object.keys(this.globalAttrs);}}Schema.default=/*@__PURE__*/new Schema();function elementName(doc,tree,max=doc.length){if(!tree)return"";let tag=tree.firstChild;let name=tag&&tag.getChild("TagName");return name?doc.sliceString(name.from,Math.min(name.to,max)):"";}function findParentElement(tree,skip=false){for(;tree;tree=tree.parent)if(tree.name=="Element"){if(skip)skip=false;else return tree;}return null;}function allowedChildren(doc,tree,schema){let parentInfo=schema.tags[elementName(doc,findParentElement(tree))];return(parentInfo===null||parentInfo===void 0?void 0:parentInfo.children)||schema.allTags;}function openTags(doc,tree){let open=[];for(let parent=findParentElement(tree);parent&&!parent.type.isTop;parent=findParentElement(parent.parent)){let tagName=elementName(doc,parent);if(tagName&&parent.lastChild.name=="CloseTag")break;if(tagName&&open.indexOf(tagName)<0&&(tree.name=="EndTag"||tree.from>=parent.firstChild.to))open.push(tagName);}return open;}const identifier=/^[:\-\.\w\u00b7-\uffff]*$/;function completeTag(state,schema,tree,from,to){let end=/\s*>/.test(state.sliceDoc(to,to+5))?"":">";let parent=findParentElement(tree,true);return{from,to,options:allowedChildren(state.doc,parent,schema).map(tagName=>({label:tagName,type:"type"})).concat(openTags(state.doc,tree).map((tag,i)=>({label:"/"+tag,apply:"/"+tag+end,type:"type",boost:99-i}))),validFor:/^\/?[:\-\.\w\u00b7-\uffff]*$/};}function completeCloseTag(state,tree,from,to){let end=/\s*>/.test(state.sliceDoc(to,to+5))?"":">";return{from,to,options:openTags(state.doc,tree).map((tag,i)=>({label:tag,apply:tag+end,type:"type",boost:99-i})),validFor:identifier};}function completeStartTag(state,schema,tree,pos){let options=[],level=0;for(let tagName of allowedChildren(state.doc,tree,schema))options.push({label:"<"+tagName,type:"type"});for(let open of openTags(state.doc,tree))options.push({label:"</"+open+">",type:"type",boost:99-level++});return{from:pos,to:pos,options,validFor:/^<\/?[:\-\.\w\u00b7-\uffff]*$/};}function completeAttrName(state,schema,tree,from,to){let elt=findParentElement(tree),info=elt?schema.tags[elementName(state.doc,elt)]:null;let localAttrs=info&&info.attrs?Object.keys(info.attrs):[];let names=info&&info.globalAttrs===false?localAttrs:localAttrs.length?localAttrs.concat(schema.globalAttrNames):schema.globalAttrNames;return{from,to,options:names.map(attrName=>({label:attrName,type:"property"})),validFor:identifier};}function completeAttrValue(state,schema,tree,from,to){var _a;let nameNode=(_a=tree.parent)===null||_a===void 0?void 0:_a.getChild("AttributeName");let options=[],token=undefined;if(nameNode){let attrName=state.sliceDoc(nameNode.from,nameNode.to);let attrs=schema.globalAttrs[attrName];if(!attrs){let elt=findParentElement(tree),info=elt?schema.tags[elementName(state.doc,elt)]:null;attrs=(info===null||info===void 0?void 0:info.attrs)&&info.attrs[attrName];}if(attrs){let base=state.sliceDoc(from,to).toLowerCase(),quoteStart='"',quoteEnd='"';if(/^['"]/.test(base)){token=base[0]=='"'?/^[^"]*$/:/^[^']*$/;quoteStart="";quoteEnd=state.sliceDoc(to,to+1)==base[0]?"":base[0];base=base.slice(1);from++;}else{token=/^[^\s<>='"]*$/;}for(let value of attrs)options.push({label:value,apply:quoteStart+value+quoteEnd,type:"constant"});}}return{from,to,options,validFor:token};}function htmlCompletionFor(schema,context){let{state,pos}=context,tree=syntaxTree(state).resolveInner(pos,-1),around=tree.resolve(pos);for(let scan=pos,before;around==tree&&(before=tree.childBefore(scan));){let last=before.lastChild;if(!last||!last.type.isError||last.from<last.to)break;around=tree=before;scan=last.from;}if(tree.name=="TagName"){return tree.parent&&/CloseTag$/.test(tree.parent.name)?completeCloseTag(state,tree,tree.from,pos):completeTag(state,schema,tree,tree.from,pos);}else if(tree.name=="StartTag"){return completeTag(state,schema,tree,pos,pos);}else if(tree.name=="StartCloseTag"||tree.name=="IncompleteCloseTag"){return completeCloseTag(state,tree,pos,pos);}else if(tree.name=="OpenTag"||tree.name=="SelfClosingTag"||tree.name=="AttributeName"){return completeAttrName(state,schema,tree,tree.name=="AttributeName"?tree.from:pos,pos);}else if(tree.name=="Is"||tree.name=="AttributeValue"||tree.name=="UnquotedAttributeValue"){return completeAttrValue(state,schema,tree,tree.name=="Is"?pos:tree.from,pos);}else if(context.explicit&&(around.name=="Element"||around.name=="Text"||around.name=="Document")){return completeStartTag(state,schema,tree,pos);}else{return null;}}/**
  Create a completion source for HTML extended with additional tags
  or attributes.
  */function htmlCompletionSourceWith(config){let{extraTags,extraGlobalAttributes:extraAttrs}=config;let schema=extraAttrs||extraTags?new Schema(extraTags,extraAttrs):Schema.default;return context=>htmlCompletionFor(schema,context);}const jsonParser=/*@__PURE__*/javascriptLanguage.parser.configure({top:"SingleExpression"});const defaultNesting=[{tag:"script",attrs:attrs=>attrs.type=="text/typescript"||attrs.lang=="ts",parser:typescriptLanguage.parser},{tag:"script",attrs:attrs=>attrs.type=="text/babel"||attrs.type=="text/jsx",parser:jsxLanguage.parser},{tag:"script",attrs:attrs=>attrs.type=="text/typescript-jsx",parser:tsxLanguage.parser},{tag:"script",attrs(attrs){return /^(importmap|speculationrules|application\/(.+\+)?json)$/i.test(attrs.type);},parser:jsonParser},{tag:"script",attrs(attrs){return!attrs.type||/^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^module$|^$/i.test(attrs.type);},parser:javascriptLanguage.parser},{tag:"style",attrs(attrs){return(!attrs.lang||attrs.lang=="css")&&(!attrs.type||/^(text\/)?(x-)?(stylesheet|css)$/i.test(attrs.type));},parser:cssLanguage.parser}];const defaultAttrs=/*@__PURE__*/[{name:"style",parser:/*@__PURE__*/cssLanguage.parser.configure({top:"Styles"})}].concat(/*@__PURE__*/eventAttributes.map(name=>({name,parser:javascriptLanguage.parser})));/**
  A language provider based on the [Lezer HTML
  parser](https://github.com/lezer-parser/html), extended with the
  JavaScript and CSS parsers to parse the content of `<script>` and
  `<style>` tags.
  */const htmlPlain=/*@__PURE__*/LRLanguage.define({name:"html",parser:/*@__PURE__*/parser$2.configure({props:[/*@__PURE__*/indentNodeProp.add({Element(context){let after=/^(\s*)(<\/)?/.exec(context.textAfter);if(context.node.to<=context.pos+after[0].length)return context.continue();return context.lineIndent(context.node.from)+(after[2]?0:context.unit);},"OpenTag CloseTag SelfClosingTag"(context){return context.column(context.node.from)+context.unit;},Document(context){if(context.pos+/\s*/.exec(context.textAfter)[0].length<context.node.to)return context.continue();let endElt=null,close;for(let cur=context.node;;){let last=cur.lastChild;if(!last||last.name!="Element"||last.to!=cur.to)break;endElt=cur=last;}if(endElt&&!((close=endElt.lastChild)&&(close.name=="CloseTag"||close.name=="SelfClosingTag")))return context.lineIndent(endElt.from)+context.unit;return null;}}),/*@__PURE__*/foldNodeProp.add({Element(node){let first=node.firstChild,last=node.lastChild;if(!first||first.name!="OpenTag")return null;return{from:first.to,to:last.name=="CloseTag"?last.from:node.to};}}),/*@__PURE__*/bracketMatchingHandle.add({"OpenTag CloseTag":node=>node.getChild("TagName")})]}),languageData:{commentTokens:{block:{open:"<!--",close:"-->"}},indentOnInput:/^\s*<\/\w+\W$/,wordChars:"-._"}});/**
  A language provider based on the [Lezer HTML
  parser](https://github.com/lezer-parser/html), extended with the
  JavaScript and CSS parsers to parse the content of `<script>` and
  `<style>` tags.
  */const htmlLanguage=/*@__PURE__*/htmlPlain.configure({wrap:/*@__PURE__*/configureNesting(defaultNesting,defaultAttrs)});/**
  Language support for HTML, including
  [`htmlCompletion`](https://codemirror.net/6/docs/ref/#lang-html.htmlCompletion) and JavaScript and
  CSS support extensions.
  */function html(config={}){let dialect="",wrap;if(config.matchClosingTags===false)dialect="noMatch";if(config.selfClosingTags===true)dialect=(dialect?dialect+" ":"")+"selfClosing";if(config.nestedLanguages&&config.nestedLanguages.length||config.nestedAttributes&&config.nestedAttributes.length)wrap=configureNesting((config.nestedLanguages||[]).concat(defaultNesting),(config.nestedAttributes||[]).concat(defaultAttrs));let lang=wrap?htmlPlain.configure({wrap,dialect}):dialect?htmlLanguage.configure({dialect}):htmlLanguage;return new LanguageSupport(lang,[htmlLanguage.data.of({autocomplete:htmlCompletionSourceWith(config)}),config.autoCloseTags!==false?autoCloseTags:[],javascript().support,css().support]);}const selfClosers=/*@__PURE__*/new Set(/*@__PURE__*/"area base br col command embed frame hr img input keygen link meta param source track wbr menuitem".split(" "));/**
  Extension that will automatically insert close tags when a `>` or
  `/` is typed.
  */const autoCloseTags=/*@__PURE__*/EditorView.inputHandler.of((view,from,to,text,insertTransaction)=>{if(view.composing||view.state.readOnly||from!=to||text!=">"&&text!="/"||!htmlLanguage.isActiveAt(view.state,from,-1))return false;let base=insertTransaction(),{state}=base;let closeTags=state.changeByRange(range=>{var _a,_b,_c;let didType=state.doc.sliceString(range.from-1,range.to)==text;let{head}=range,after=syntaxTree(state).resolveInner(head,-1),name;if(didType&&text==">"&&after.name=="EndTag"){let tag=after.parent;if(((_b=(_a=tag.parent)===null||_a===void 0?void 0:_a.lastChild)===null||_b===void 0?void 0:_b.name)!="CloseTag"&&(name=elementName(state.doc,tag.parent,head))&&!selfClosers.has(name)){let to=head+(state.doc.sliceString(head,head+1)===">"?1:0);let insert=`</${name}>`;return{range,changes:{from:head,to,insert}};}}else if(didType&&text=="/"&&after.name=="IncompleteCloseTag"){let tag=after.parent;if(after.from==head-2&&((_c=tag.lastChild)===null||_c===void 0?void 0:_c.name)!="CloseTag"&&(name=elementName(state.doc,tag,head))&&!selfClosers.has(name)){let to=head+(state.doc.sliceString(head,head+1)===">"?1:0);let insert=`${name}>`;return{range:EditorSelection.cursor(head+insert.length,-1),changes:{from:head,to,insert}};}}return{range};});if(closeTags.changes.empty)return false;view.dispatch([base,state.update(closeTags,{userEvent:"input.complete",scrollIntoView:true})]);return true;});const twigLanguage=LRLanguage.define({parser:parser$3.configure({props:[foldNodeProp.add({IfTag(node){let first=node.firstChild,last=node.lastChild;if(!first||first.name!=="StartIfTag")return null;return{from:first.to,to:last.name==="EndIfTag"?last.from:node.to};},ForTag(node){let first=node.firstChild,last=node.lastChild;if(!first||first.name!=="StartForTag")return null;return{from:first.to,to:last.name==="EndForTag"?last.from:node.to};}})],wrap:parseMixed(node=>{if(node.type.isTop){return{parser:htmlLanguage.parser,overlay:node=>node.type.name==="Text"};}return null;})}),languageData:{commentTokens:{block:{open:"{#",close:"#}"}}}});function twig(){return new LanguageSupport(twigLanguage,[html().support]);}(function($,window,document,undefined$1){/**
       * https://codemirror.net/docs/migration/#codemirror.fromtextarea
       *
       * @returns {EditorView}
       */function editorFromTextArea(textarea){let view=new EditorView({doc:textarea.value,extensions:[basicSetup,materialDark,twig(),EditorView.updateListener.of(v=>{if(v.docChanged){$(textarea).trigger('codemirror:changed',view.state.doc.toString());}})]});textarea.parentNode.insertBefore(view.dom,textarea);textarea.style.display="none";if(textarea.form){textarea.form.addEventListener("submit",()=>{textarea.value=view.state.doc.toString();});}return view;}/**
       * Toolbar helpers.
       *
       * @param $container
       * @constructor
       */function Toolbar($container){/**
           * Container.
           *
           * @type {jQuery}
           */var $toolbar;/**
           * Create the toolbar.
           *
           * @return {void}
           */var createToolbar=function(){$toolbar=$('<div>',{class:'toolbar-wrapper sp-z-50'}).append($('<div>',{class:'toolbar'}));$container.prepend($toolbar);};/**
           * Add a button to the toolbar. Use .on('click', fn) to handle what should happen when the
           * toolbar button is pressed.
           *
           * @param name
           * @param data
           * @returns {jQuery}
           */this.addButton=function(name,data){if(!$toolbar){createToolbar();}var $button=$('<a/>',{class:'button button-icon button-name-'+name,href:'#',title:data.title||'',role:'button',alt:data.title||''});if(data.icon){$button.html(data.icon);}$toolbar.find('.toolbar').append($button);return $button;};}/**
       * Add merge fields to the toolbar.
       *
       * @param {{codemirror: Editor, syntaxEmailTemplate: boolean}} parameters
       */function addToToolbar(parameters){var codemirror=parameters.codemirror;var mergeFields=new MergeFields({valFn:()=>codemirror.codemirror().state.doc.toString(),syntaxEmailTemplate:parameters.mergefields_syntaxEmailTemplate});mergeFields.init(codemirror.container());mergeFields.callback(codemirror.codemirror().state.doc.toString());codemirror.element().on('codemirror:changed',function(e,val){mergeFields.callback(val);});var $button=parameters.toolbar.addButton('mergefields',{title:MergeFields.translations.merge_fields,icon:MergeFields.icon});$button.on('click',function(e){Swal.fire({title:MergeFields.translations.merge_fields,html:$('<div/>',{style:'text-align: initial'}).append(MergeFields.modalContent),width:800,showCloseButton:true,showConfirmButton:false,showClass:{popup:'swal2-noanimation',backdrop:'swal2-noanimation'},hideClass:{popup:'',backdrop:''},willOpen:function(){var $modal=MergeFields.appendTo($(Swal.getHtmlContainer()),parameters.show_tickets,parameters.show_canned_responses,parameters.show_organisations);$modal.on('mergefield:inserted',function(e,data){Swal.close();if(data.value===''){return;}var instance=codemirror.codemirror(),// Gets the line number in the cursor position
cursor=instance.state.selection.main.head,newPosition=cursor+data.value.length;instance.dispatch({changes:{from:cursor,insert:data.value}});setTimeout(function(){instance.focus();instance.dispatch({selection:{anchor:newPosition,head:newPosition}});},100);});}});});}/**
       * Source code editor.
       *
       * @param element
       * @param parameters
       * @constructor
       */function Editor(element,parameters){/**
           * Default parameters.
           *
           * @type {object}
           */var defaults={toolbar:false};var editor,toolbar,$element=$(element),instance=this,containerClassName='codemirror-box';/**
           * Create a container box.
           *
           * @returns {jQuery}
           */var createContainer=function(){var $container=$('<div/>',{class:containerClassName});$element.add($element.prev('.cm-editor')).wrapAll($container);};/**
           * Initialise the editor.
           */var init=function(){// Initialise the text area.
$element=$(element);$element.addClass('sc-textarea');var options=$.extend(true,defaults,parameters);editor=editorFromTextArea(element);// Wrap the editor in a container.
createContainer();// Add toolbar if necessary.
if(options.toolbar){toolbar=new Toolbar(instance.container());addToToolbar({toolbar:toolbar,codemirror:instance,show_tickets:parameters.mergefields_tickets,show_organisations:parameters.mergefields_organisations,show_canned_responses:parameters.mergefields_canned_responses,syntaxEmailTemplate:parameters.mergefields_syntaxEmailTemplate});}};/**
           * The container element.
           *
           * @returns {jQuery}
           */this.container=function(){return $element.parent('.'+containerClassName);};/**
           * The textarea.
           *
           * @returns {*|jQuery|HTMLElement|JQuery<HTMLElement>}
           */this.element=function(){return $element;};/**
           * Code mirror instance.
           *
           * @returns {EditorView}
           */this.codemirror=function(){return editor;};/**
           * Get the content of the editor.
           *
           * @returns {string}
           */this.getContent=function(){return editor.state.doc.toString();};/**
           * Synchronise textarea value with code mirror value.
           */this.save=function(){$element[0].value=this.getContent();};// Initialise!
init();}$.fn.sourcecode=function(options){return $(this).each(function(){$(this)[0].sourcecode=new Editor($(this)[0],options);});};})($);})();