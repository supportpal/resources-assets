/**
 * Convert bytes into a human readable string
 */
Object.defineProperty(Number.prototype,'fileSize',{value:function(a,b,c,d){
    return (a=a?[1e3,'k','B']:[1024,'K','iB'],b=Math,c=b.log,
            d=c(this)/c(a[0])|0,this/b.pow(a[0],d)).toFixed(2)
        +' '+(d?(a[1]+'MGTPEZY')[--d]+a[2]:'Bytes');
},writable:false,enumerable:false});

function ZipFile()
{
    "use strict";

    /**
     * Fetch the content and return the associated promise.
     *
     * @param {String} url the url of the content to fetch.
     * @return {Promise} the promise containing the data.
     */
    var urlToPromise = function (url) {
        return new Promise(function(resolve, reject) {
            JSZipUtils.getBinaryContent(url, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    /**
     *
     * @param $attachments
     * @param {string} filename
     */
    this.create = function ($attachments, filename)
    {
        $('.sp-all-attachments.sp-alert').fadeIn();

        filename = filename.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase()
        if (filename.length === 0) {
            filename = 'attachments'
        }

        var zip = new JSZip();

        // Get the files we want to include in the zip.
        $attachments.each(function () {
            zip.file($(this).data('filename'), urlToPromise($(this).data('download-url')), {binary:true});
        });

        // Download files, build zip, and trigger download of zip.
        zip
          .generateAsync({type:"blob"})
          .then(function callback(blob) {
              saveAs(blob, filename + '.zip');

              $('.sp-all-attachments.sp-alert').fadeOut();
          }, function (e) {
              Swal.fire(Lang.get('messages.error'), e, 'error');
          });
    }
}

ZipFile.isSupported = function ()
{
    return JSZip.support.blob && window.saveAs && window.Promise
}

/**
 * Functions to handle a file uploads.
 *
 * @param parameters
 * @constructor
 */
function FileUpload(parameters)
{
    "use strict";

    // Default function arguments.
    var DEFAULT = {
        $element: $('.sp-file-upload'),
        $container: $('.sp-file-upload').parents('form:visible'),
        inputName: 'attachment',
        registerEvents: true,
        blueimp: {
            //
        }
    };

    // Merge user provided parameters with the default.
    var settings = $.extend(true, {}, DEFAULT, parameters);

    /*
     * Instance variables.
     */
    var self = this,
        total_files_uploaded = 0,
        cumulative_file_size = 0,
        MAX_FILE_SIZE = FileUpload.MAX_FILE_SIZE,
        DEFAULT_OPTIONS = {
            singleFileUploads: true,
            acceptFileTypes: new RegExp($('meta[name="allowed_files"]').prop('content'), "i"),
            maxFileSize: MAX_FILE_SIZE,
            dataType: 'json',
            formData: [],
            messages: {
                acceptFileTypes: Lang.get('messages.upload_wrong_type'),
                maxFileSize: Lang.get('messages.upload_max_size', {'size': MAX_FILE_SIZE.fileSize()})
            }
        };

    /*
     * Initialise blueimp.
     */
    var $fileupload = settings.$element.fileupload(
        $.extend({}, DEFAULT_OPTIONS, settings.blueimp, {
            add: function (e, data) {
                var $this = $(this),
                    that = $this.data('blueimp-fileupload') || $this.data('fileupload'),
                    options = that.options;

                $(self).trigger('upload:started');

                // Foreach file add it to the DOM
                $.each(data.files, function (index, file) {
                    // Add file information to the view.
                    data.context = self.addFile(file.name, file.size);

                    // Increment the counter
                    total_files_uploaded++;
                });

                data.process(function () {
                    return $this.fileupload('process', data);
                }).done(function () {
                    if ((that._trigger('added', e, data) !== false)
                        && (options.autoUpload || data.autoUpload) && data.autoUpload !== false
                    ) {
                        // Disable the form submit button, so they can't submit until file upload is complete.
                        $this.parents('form').find('input[type=submit]').prop('disabled', 'disabled');

                        // Submit the request.
                        data.submit();
                    }
                }).fail(function () {
                    if (data.files.error) {
                        $.each(data.files, function (index, file) {
                            var error = file.error;
                            if (error) {
                                handleFailedUpload(data, error, $this);
                            }
                        });
                    }
                });
            },
            progress: function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $(data.context).find('.sp-bar').css('width', progress + '%');
            },
            submit: function (e, data) {
                var $this = $(this),
                    that = $this.data('blueimp-fileupload') || $this.data('fileupload'),
                    options = that.options;

                // Calculate cumulative size of attachments.
                $.each(data.files, function (index, file) {
                    self.incrementTotalUploadedFileSize(file.size);
                });

                // Block upload that exceed the cumulative limit.
                if (typeof options.cumulativeMaxFileSize !== 'undefined'
                    && self.totalUploadedFileSize() > options.cumulativeMaxFileSize
                ) {
                    handleFailedUpload(
                        data,
                        Lang.get('core.attachment_limit_reached', { size: options.cumulativeMaxFileSize.fileSize() }),
                        $this
                    );

                    return false;
                }
            },
            done: function (e, data) {
                var $self = $(this);

                $.each(data.result, function (index, file) {
                    // The file failed to upload
                    if (file.hasOwnProperty('error')) {
                        handleFailedUpload(data, file.error, $self);
                        return true; // continue;
                    }

                    // The file successfully uploaded.
                    self.registerFile($(data.context), file.filename, file.hash, file.delete_url);
                });

                // Renable the form after all files have uploaded.
                if (--total_files_uploaded == 0) {
                    // Re-enable the form submit button
                    $self.parents('form').find('input[type=submit]').prop('disabled', false);

                    $(self).trigger('upload:complete');
                }
            },
            fail: function (e, data) {
                // This function gets called separately for each upload that fails.
                handleFailedUpload(data, data.errorThrown, $(this));
            }
        })
    );

    /**
     * Handle failed uploads.
     *
     * @param data
     * @param message
     * @param $context jQuery object for the input.fileupload element.
     */
    var handleFailedUpload = function (data, message, $context) {
        // Re-enable the form after all files have uploaded.
        if (--total_files_uploaded == 0) {
            // Re-enable the form submit button
            $context.parents('form').find('input[type=submit]').prop('disabled', false);
        }

        // Decrement cumulative file size count.
        $.each(data.files, function (index, file) {
            self.decrementTotalUploadedFileSize(file.size);
        });

        // Remove the list item
        $(data.context).remove();

        // Get error message container.
        var $box = $('.sp-alert-error.attachment:first');

        // If error box doesn't exist.
        if (! $box.length) {
            $box = $('<div>').addClass('sp-alert sp-alert-error sp-mt-4 sp-mb-0 sp-hidden');
            $box.insertAfter($context.parents('form').find('.sp-attached-files'));
        }

        var $container = $box,
            reason = Lang.get('messages.upload_error', { 'filename': data.files[0].name, 'reason': message });

        // If it's frontend, we have to show the message inside a container.
        if ($box.find('.sp-container').length) {
            $container = $box.find('.sp-container');
        }

        if ($box.is(':visible')) {
            $container.append('<br />' + reason);
        } else {
            $container.text(reason);
        }

        $box.fadeIn().delay(10000).fadeOut();

        // Scroll to message (if not sticky).
        if (! $box.hasClass('sp-alert-sticky')) {
            $('html, body, #content').animate({scrollTop: $box.position().top - 24}, 500);
        }
    };

    /**
     * The cumulative max file size if it's been set.
     */
    this.cumulativeMaxFileSize = settings.blueimp.cumulativeMaxFileSize;

    /**
     * Get the cumulative size of all uploaded files.
     *
     * @returns {number}
     */
    this.totalUploadedFileSize = function ()
    {
        return cumulative_file_size;
    };

    /**
     * Increment the total size of files that have been uploaded.
     *
     * @param size
     */
    this.incrementTotalUploadedFileSize = function (size)
    {
        cumulative_file_size += size;
    };

    /**
     * Decrement the total size of files that have been uploaded.
     *
     * @param size
     */
    this.decrementTotalUploadedFileSize = function (size)
    {
        cumulative_file_size -= size;
    };

    /**
     * Show an uploaded file in the view.
     *
     * @param filename
     * @param filesize
     * @return {*|jQuery}
     */
    this.addFile = function (filename, filesize)
    {
        var ul = settings.$container.find('.sp-attached-files');

        // Copy the first li instance
        ul.find('li:first').clone(true).appendTo(ul);

        // Set the file information
        ul.find('li:last span.sp-file-information span.sp-filename').text(filename);
        ul.find('li:last span.sp-file-information span.sp-filesize').text('(' + filesize.fileSize() + ')');
        ul.find('li:last').removeClass('sp-hidden');
        ul.find('li:last .sp-delete-attachment').attr('data-size', filesize).hide();

        return ul.find('li:last');
    };

    /**
     * Register a completed upload.
     *
     * @param $item
     * @param filename
     * @param hash
     * @param delete_url
     */
    this.registerFile = function ($item, filename, hash, delete_url)
    {
        // The file successfully uploaded
        $item.find('.sp-progress-bar').hide();
        $item.find('.sp-delete-attachment')
            .data('hash', hash)
            .data('url', delete_url)
            .show();

        // Create attachment input - we use this to link it to the ticket message
        var input = settings.$container.find('input[name="' + settings.inputName + '[]"]')
            .clone()
            .prop('disabled', false)
            .appendTo(settings.$container.find('.sp-attachment-details'));
        input.attr('name', settings.inputName + '[' + hash + ']');
        input.attr('id', settings.inputName + '[' + hash + ']');
        input.val(filename);
    };

    /**
     * Delete a file that hasn't been attached to a final record (uploaded but form hasn't been submit). May have been
     * attached to a draft so we do still need to feed an ID if we have.
     *
     * @param context
     * @param silent
     */
    this.deleteNewFile = function (context, silent)
    {
        var data = [];
        data.push({ name: 'hash', value: $(context).data('hash') });
        if (typeof $(context).data('attachment-id') !== 'undefined') {
            data.push({ name: 'id', value: $(context).data('attachment-id') });
        }

        return FileUpload.deleteAttachment(
            context,
            $(context).data('url'),
            data,
            $(context).parents('li'),
            function(context) {
                settings.$container.find('input[name="' + settings.inputName + '['+ $(context).data().hash +']"]')
                    .remove();

                // Decrement cumulative file size.
                self.decrementTotalUploadedFileSize($(context).data('size'));
            },
            silent
        );
    };

    /**
     * Get parameters.
     */
    this.getParameters = function ()
    {
        return settings;
    };

    /**
     * Register file upload events.
     *
     * @return void
     */
    var registerEvents = function () {

        /**
         * Handle deleting an existing attachment that belongs to a ticket message.
         */
        $(document).on('click', '.sp-message .sp-delete-attachment', function (e) {
            var data = [];
            data.push({ name: 'id', value: $(this).data('attachment-id') });
            if (typeof $(this).data('token') !== 'undefined') {
                data.push({ name: 'token', value: $(this).data('token') });
            }

            FileUpload.deleteAttachment(
                this,
                $(this).data('url'),
                data,
                $(this).parents('li'),
                function(context) {
                    // Grab the message that the attachment belongs to
                    var $message = $(context).parents('.sp-message');

                    // If we deleted the last attachment, hide the attachments area
                    if ($message.find('ul.sp-attachments li').length == 1) {
                        $message.find('.sp-attachment, ul.sp-attachments').hide();
                    }

                    // Decrement cumulative file size.
                    self.decrementTotalUploadedFileSize($(context).data('size'));
                },
                false
            );
        });

        /**
         * Handle removing attachments from a new ticket reply (they aren't actually associated with anything yet).
         */
        $(settings.$container).on('click', '.sp-attached-files .sp-delete-attachment', function () {
            self.deleteNewFile(this, $(this).data('silent') === true);
        });

        /*
         * Show a drag and drop box when dragging a file over to give a visual guide. They can actually drop it anywhere
         * in the browser.
         */
        $(document).on('dragover', function (e) {
            var dragover = $('.sp-attachment-dragover'),
                timeout = window.dropZoneTimeout;

            // Show box if not currently visible
            if (! dragover.is(':visible')) {
                dragover.show();
            }

            // If timeout if there, clear it as we want to keep showing it
            if (timeout) {
                clearTimeout(timeout);
            }

            // Set a timeout to hide the box after we drop/drag out
            window.dropZoneTimeout = setTimeout(function () {
                window.dropZoneTimeout = null;
                dragover.hide();
            }, 500);
        });

        $(document).on('drop', function (e) {
            $('.sp-attachment-dragover').hide();
        });
    };


    // Register events.
    if (settings.registerEvents) {
        registerEvents();
    }
}

/*
 * Static FileUpload properties.
 */
FileUpload.MAX_FILE_SIZE = Number($('meta[name="max_file_size"]').prop('content'));

/*
 * Static FileUpload functions.
 */
FileUpload.deleteAttachment = function (context, url, data, $listItem, successCallback, silent) {

    var name = $('<div/>').text($listItem.find('.filename').text()).html(),
        success = function () {
            // Call the success callback
            if (typeof successCallback === 'function') {
                successCallback.call(this, context);
            }

            // Remove the list item from the interface
            if (! silent) {
                Swal.fire(
                    Lang.get('messages.deleted'),
                    Lang.get('messages.success_deleted', {'item': Lang.choice('general.attachment', 1)}),
                    'success'
                );
            }

            $listItem.remove();
        };

    // Send AJAX call to delete the attachment.
    if (! silent) {
        var params = {};
        // Special case, if there's no URL then there's no database record so just remove the item from the view.
        if (typeof url !== 'undefined') {
            params.ajax = {
                url: url,
                data: data
            };
        }
        (new deleteAlert(params))
            .fireDefault(Lang.choice('general.attachment', 1), name)
            .then(function (result) {
                if (result.value) {
                    success();
                }
            });
    } else {
        // Special case, if there's no URL then there's no database record so just remove the item from the view.
        if (typeof url === 'undefined') {
            return success();
        }

        return $.ajax({ url: url, type: 'DELETE', data: data })
            .then(function (result) {
                if (result.status == 'success') {
                    success();
                }
            });
    }
};
