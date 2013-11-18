/*
Simple Image Rotator plugin: http://om4.com.au/wordpress-plugins/simple-image-rotator-plugin/

$Revision: 5160 $
$LastChangedDate: 2013-11-11 14:57:45 +1100 (Mon, 11 Nov 2013) $
*/

var $j = jQuery.noConflict();

/**
 * Change the to the next (or previous) image in the rotator.
 *
 * Function is called automatically by the web browser's interval feature, or manually when the next/previous navigation buttons are clicked
 *
 * @param id string HTML ID of the image rotator
 * @param direction string next|previous. Optional - defaults to next
 */
function ChangeImage(id, direction) {
    
    var selector,
	active,
	next;

    if ( direction === undefined ) {
	direction = 'next';
    }

    // The CSS selector, based on the id passed to this function
    selector = "#" + id;
    
    if ( rotatorSettings[id]['intransition'] ) {
	debug (selector + ' ChangeImage() called during transition period -> ignoring request');
	return;
    }

    active = $j(selector + ' img.active');

    if (direction == 'next') {
	next = $j(active).next('img');
    } else if (direction == 'previous') {
	next = $j(active).prev('img');
    }

    // Set the next image in the order they appear in the markup
    if (next.length) {
    	// We aren't at the end of the rotator yet
    } else {
    	// We have just completed this cycle
	
	if (direction == 'next') {
	    // Reset the the first image in the rotator
	    next = $j(selector + ' img:first');
	    rotatorSettings[id]['imagenumber'] = 0;
	    
	    
	} else {
	    // Reset the the last image in the rotator
	    next = $j(selector + ' img:last');
	    rotatorSettings[id]['imagenumber'] = rotatorSettings[id]['totalnumimages'] + 1;
	}

	
	debug (selector + ' imagenumber reset to ' + rotatorSettings[id]['imagenumber']);

	// Increment the cycle count
	rotatorSettings[id]['cyclecount'] += 1;
    	debug (selector + ' completed cycle #' + rotatorSettings[id]['cyclecount'] + ' of ' + rotatorSettings[id]['cycles']);
    	
    	// If cycles = 0, then it's unlimited
    	if (rotatorSettings[id]['cycles'] > 0 && rotatorSettings[id]['cycles'] == rotatorSettings[id]['cyclecount']) {
    		// No more cycles left, stop the rotator
    		StopRotator(id);
    		return;
    	}
    }

    StartImageTransition(id);

    $j(next)
    	.addClass('next')
    	.fadeTo(rotatorSettings[id]['transition'], 1.0, function() {
	    $j(this).addClass('active');
	    if (direction == 'next') {
		rotatorSettings[id]['imagenumber'] += 1;
	    } else if (direction == 'previous') {
		rotatorSettings[id]['imagenumber'] -= 1;
	    }
	    debug (selector + ' imagenumber ' + rotatorSettings[id]['imagenumber'] + ': src=' + $j(this).attr('src'));
	    $j(selector + " .navigation .imagenumber").html(rotatorSettings[id]['imagenumber']);
	    
	    EndImageTransition(id);
	}
    );
    $j(active)
    	.removeClass('next')
    	.fadeTo(rotatorSettings[id]['transition'], 0.0, function() {
	    $j(this).removeClass('active');
	}
    );
}


jQuery(document).ready(function($){
	// Register each image rotator on the page
	var i,
	    rotators = $j("div.simplerotator"),
	    numRotators = rotators.size(),
	    id,
	    parent,
	    rotatorid,
	    self,
	    imgRatio,
	    windowWidth,
	    windowHeight,
	    imgWidth,
	    imgHeight,
	    delay;
	
	for (i = 0; i < numRotators; i++) {
		
	    id = $j(rotators[i]).attr('id');

	    rotatorSettings[id]['imagenumber'] = 1;
	    rotatorSettings[id]['intransition'] = false;
	    rotatorSettings[id]['loadeventfired'] = false;

	    /*
	    When the first image has finished loading in the browser.
	    However, as per http://api.jquery.com/load-event/, the load event for images does not work consistently
	    nor reliably cross-browser, which is why we use the 'loadeventfired' flag.
	    */
	    $j('#' + id + ' img.first').on('load',function() {

	    	if ( rotatorSettings[id]['loadeventfired'] == true ) {
	    		return; // load event for this image has already been fired
	    	}
	    	rotatorSettings[id]['loadeventfired'] = true;
	    	
	    	// The parent DIV. Can't use parent because an a tag may exist (if the href shortcode attribute is used)
	    	parent = $j(this).parents('div.simplerotator')[0];
	    	
		// Obtain the unique rotator ID because it could be different to the id variable above
		rotatorid = $j(parent).attr('id');
		debug('#' + rotatorid + ': running img.load() event for ' + $j(this).attr('src'));


		if (rotatorSettings[rotatorid]['fullscreen']) { // Full Screen Rotator

		    // Image resize logic is from jQuery Backstretch v1.0 (http://github.com/srobbin/jquery-backstretch and http://srobbin.com/jquery-plugins/jquery-backstretch/)

		    debug('#' + rotatorid + ': initialising full screen rotator with offsets = T:' + rotatorSettings[rotatorid]['topoffset'] + " R:" + rotatorSettings[rotatorid]['rightoffset'] + " B:" + rotatorSettings[rotatorid]['bottomoffset'] + " L:" + rotatorSettings[rotatorid]['leftoffset'] + ', losingside = ' + rotatorSettings[rotatorid]['losingside'] + ' and ensurefullscreen = ' + rotatorSettings[rotatorid]['ensurefullscreen']);

		    $j('#' + rotatorid).css({'position': 'fixed', 'left': rotatorSettings[rotatorid]['leftoffset'], 'top': rotatorSettings[rotatorid]['topoffset'], 'z-index': '-1'});

		    self = $j(this);
		    imgRatio = self.width() / self.height();

		    function ResizeImage() {
			// If top, right, bottom and left offsets are all defined then one side must give way
			switch (rotatorSettings[rotatorid]['losingside']) {
			    case 'bottom':
				// Bottom side must give way, so ignore the bottom offset paramter
				rotatorSettings[rotatorid]['bottomoffset'] = 0;
				break;
			    case 'right':
				// Right hand side must give way, so ignore the bottom offset paramter
				rotatorSettings[rotatorid]['rightoffset'] = 0;
				break;
			}

			// Calculate the web browser's viewport dimensions (taking into account any offset values)
			windowWidth = $j(window).width() - rotatorSettings[rotatorid]['leftoffset'] - rotatorSettings[rotatorid]['rightoffset'];
			windowHeight = $j(window).height() - rotatorSettings[rotatorid]['topoffset'] - rotatorSettings[rotatorid]['bottomoffset'];
			
			// Calculate the appropriate image dimensions
			switch (rotatorSettings[rotatorid]['losingside']) {
			    case 'bottom':
				imgWidth = windowWidth;
				imgHeight = imgWidth / imgRatio;
				if(rotatorSettings[rotatorid]['ensurefullscreen'] && imgHeight < windowHeight) {
				    debug('#' + rotatorid + ': White space detected between the bottom of the image and the bottom of the browser window -> increasing image height (potentially chopping off the right hand side of the image)');
				    imgHeight = windowHeight;
				    imgWidth = imgHeight * imgRatio;
				}
				break;
			    case 'right':
				imgHeight = windowHeight;
				imgWidth = imgHeight * imgRatio;
				if(rotatorSettings[rotatorid]['ensurefullscreen'] && imgWidth < windowWidth) {
				    debug('#' + rotatorid + ': White space detected between the right hand side of the image and the right hand side of the browser window -> increasing image width (potentially chopping off the bottom side of the image)');
				    imgWidth = windowWidth;
				    imgHeight = imgWidth / imgRatio;
				}
				break;
			}

			debug('#' + rotatorid + ': browser window dimensions: ' + $j(window).width() + ' x ' + $j(window).height());
			debug('#' + rotatorid + ': adjusted window dimensions: ' + windowWidth + ' x ' + windowHeight);
			debug('#' + rotatorid + ': imgHeight:' + imgHeight + ', windowHeight:' + windowHeight );

			$j('#' + rotatorid + ' img').width( imgWidth ).height( imgHeight );
		    }

		    ResizeImage();

		    // Automatically adjust the image size when the browser window is resized
		    $j(window).resize(ResizeImage);
		}

		// Always Re-set the simplerotator div's width/height based on the width/height (including padding, margin and border) of the first image in the rotator set
		$j(parent).css('height', $j(this).outerHeight(true))
			  .css('width', $j(this).outerWidth(true));
		
		$j('#' + rotatorid + ' img').removeClass('hidden first');
	    }); // End img.load() event


	    // Manually trigger the img.load() event because some browsers don't trigger it for cached images
	    // We only do this if the image has a width (because otherwise it might not have loaded yet)
	    if ( rotatorSettings[id]['loadeventfired'] == false && $j('#' + id + ' img.first').width() > 0 ) {
	    	$j('#' + id + ' img.first').trigger('load');
	    }

	    if (rotatorSettings[id]['totalnumimages'] == 1) {
		// this image rotator only has one image -> skip this rotator
		continue;
	    }

	    // Set up the next/previous navigation bar if necessary

	    if (rotatorSettings[id]['shownavigation'] == 'true' || rotatorSettings[id]['shownavigation'] == 'onhover') {

		// Set up the navigation bar
		debug('#' + id + ': navigation intialised');

		$j('#' + id + " .navigation").append('<ul>');
		$j('#' + id + " .navigation ul")
		    .append('<li class="nav prev enabled"><a href="#" title="Previous"><span>&larr;</span></a></li>')
		    .append('<li class="imagenumbers"><span class="imagenumber">1</span> / <span class="totalimages">' + rotatorSettings[id]['totalnumimages'] + '</span></li>')
		    .append('<li class="nav next enabled"><a href="#" title="Next"><span>&rarr;</span></a></li>')
		    .append('</ul>')
		;

		if (rotatorSettings[id]['shownavigation'] == 'true') {
		    // Navigation should always be shown
		    $j('#' + id + " .navigation").show();
		    debug('#' + id + ': navigation always shown');
		} else if (rotatorSettings[id]['shownavigation'] == 'onhover') {
		    // Navigation should be shown on hover
		    debug('#' + id + ': navigation shown on hover only');
		    $j('#' + id).hover(
			function() {
			    // Hovering over rotator -> fade the navigation controls in
			    debug('#' + id + ': showing navigation');
			    $j('#' + id + " .navigation").fadeIn();
			},
			function() {
			    // No longer hovering over rotator -> fade the navigation controls out
			    debug('#' + id + ': hiding navigation');
			    $j('#' + id + " .navigation").fadeOut();
			}
		    );
		}

		// Previous/Next button click handlers
		$j('div.simplerotator .navigation li.nav').click( function(e) {
		    e.preventDefault();
		    if ( ! $j(this).hasClass('disabled') ) {
		        id = $j(this).closest('div.simplerotator').attr('id');
		        if (rotatorSettings[id]['stoponnavigationclick']) StopRotator(id);
		        if ($j(this).hasClass('prev')) ShowPrevious(id);
		        else if ($j(this).hasClass('next')) ShowNext(id);
		    }
		});

	    }
	    
	    // The start delay needs to have the interval subtracted from it because the rotator won't actually start rotating until interval seconds after being set up
	    delay = rotatorSettings[id]['startdelay'] - rotatorSettings[id]['interval'];
	    
	    if (delay > 0) {
	    	setTimeout( "SetupRotator('" + id + "')", delay );
	    	debug('#' + id + ': delaying the setup of this rotator for ' + delay + 'ms');
	    } else {
	    	// Set it up immediately
	    	SetupRotator(id);
	    }
	}
});

/**
 * Set up the recurring interval, and store the interval id so we can refer to it later
 */
function SetupRotator(id) {
    debug('#' + id + ': set up rotator to run with interval = ' + rotatorSettings[id]['interval'] + 'ms   transition = ' + rotatorSettings[id]['transition'] + 'ms');
    rotatorSettings[id]['intervalid'] = setInterval( "ChangeImage('" + id + "')", rotatorSettings[id]['interval'] );
    rotatorSettings[id]['cyclecount'] = 0;
}

/**
 * Stop the image rotator from automatically rotating
 *
 * @param id string HTML ID of the image rotator
 **/
function StopRotator(id) {
    if (rotatorSettings[id]['intervalid'] == 0) return;
    clearInterval(rotatorSettings[id]['intervalid']);
    rotatorSettings[id]['intervalid'] = 0;
    debug ('#' + id + ' stopped after ' + rotatorSettings[id]['cyclecount'] + ' cycles');
}

/**
 * Show the next image in the rotator, or loop back to the start if the we're currently on the last image.
 *
 * @param id string HTML ID of the image rotator
 */
function ShowNext(id) {
    debug ('#' + id + ' ShowNext(' + id + ')');
    ChangeImage(id);
}

/**
 * Show the previous image in the rotator, or loop back to the end if the we're currently on the first image.
 *
 * @param id string HTML ID of the image rotator
 */
function ShowPrevious(id) {
    debug ('#' + id + ' ShowPrevious(' + id + ')');
    ChangeImage(id, 'previous');
}

/**
 * Adjust the image rotator when it enters the image transition phase
 *
 * @param id string HTML ID of the image rotator
 */
function StartImageTransition(id) {
    // Hide the next/prev buttons during the transition
    rotatorSettings[id]['intransition'] = true;
    if (rotatorSettings[id]['hidenavigationduringtransition']) {
	$j('#' + id + " .navigation ul li.nav")
	    .addClass('disabled')
	    .removeClass('enabled')
	;
	debug('#' + id + ': Hiding next/prev navigation buttons');
    }
}

/**
 * Adjust the image rotator when it finishes the image transition phase
 *
 * @param id string HTML ID of the image rotator
 */
function EndImageTransition(id) {
    // Hide the next/prev buttons during the transition
    rotatorSettings[id]['intransition'] = false;
    if (rotatorSettings[id]['hidenavigationduringtransition']) {
	$j('#' + id + " .navigation ul li.nav")
	    .addClass('enabled')
		.removeClass('disabled')
	;
	debug('#' + id + ': Showing next/prev navigation buttons');
    }
}

/**
 * Write a debugging message
 *
 * @param message string Debug message
 */
function debug(message) {
    if (window.console) {
	console.log(message);
    }
}