<?php
/*
Plugin Name: Simple Image Rotator
Plugin URI: http://om4.com.au/wordpress-plugins/
Description: Allows you to one or more sets of images and add them to your website so they display in rotation - like a mini slide show.
Version: 1.6.2
Author: OM4
Author URI: http://om4.com.au/
Text Domain: om4-simplerotator
Git URI: https://github.com/OM4/simple-image-rotator
Git Branch: release
License: GPLv2
*/

/*  Copyright 2009-2013 OM4 (email: info@om4.com.au    web: http://om4.com.au/)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/


class OM4_Simple_Rotator {
	
	var $version = '1.6.1';
	
	var $dbVersion = 1;
	
	var $installedVersion;
	
	var $dirname;
	
	var $url;
	
	static $number = 1;

	var $script_suffix = '';

	var $style_suffix = '';
	
	/**
	 * Constructor
	 *
	 */
	function OM4_Simple_Rotator() {
		
		// Uncomment to prevent browsers caching the JS file while debugging.
		//$this->version .= time();
		
		// Store the name of the directory that this plugin is installed in
		$this->dirname = str_replace('/rotator.php', '', plugin_basename(__FILE__));
		
		$this->url = plugins_url($this->dirname . '/');

		register_activation_hook(__FILE__, array($this, 'Activate'));
		
		add_action('init', array($this, 'LoadDomain'));
		
		add_action('init', array($this, 'CheckVersion'));
		
		add_action('init', array($this, 'RegisterShortcode'));

		add_action('wp_enqueue_scripts', array($this, 'RegisterScripts'));
		
		$this->installedVersion = intval(get_option('om4_simple_rotator_db_version'));
	}
	
	/**
	 * Intialise I18n
	 *
	 */
	function LoadDomain() {
		load_plugin_textdomain( 'om4-simplerotator', false, dirname( plugin_basename( __FILE__ ) ) );
	}
	
	/**
	 * Plugin Activation Tasks
	 *
	 */
	function Activate() {
		// There aren't really any installation tasks at the moment
		
		if (!$this->installedVersion) {
			$this->installedVersion = $this->dbVersion;
			$this->SaveInstalledVersion();
		}
	}
	
	/**
	 * Performs any upgrade tasks if required
	 *
	 */
	function CheckVersion() {
		if ($this->installedVersion != $this->dbVersion) {
			// Upgrade tasks
			if ($this->installedVersion == 0) {
				$this->installedVersion++;
			}
			$this->SaveInstalledVersion();
		}
		
	}
	
	function RegisterShortcode() {
		add_shortcode('simplerotator', array($this, 'ShortcodeHandler'));
	}
	
     /**
     * Register the required JS/CSS so it is included in the page's <head> section
     */
	function RegisterScripts() {

	    // Load the minified js and CSS files, unless these constants are set
	    $this->script_suffix = defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ? '.dev' : '';
	    $this->style_suffix = defined('STYLE_DEBUG') && STYLE_DEBUG ? '.dev' : '';

	    wp_enqueue_script('simple_rotator_js', "{$this->url}rotator{$this->script_suffix}.js", array('jquery'), $this->version);
	    wp_enqueue_style('simple_rotator', "{$this->url}rotator{$this->style_suffix}.css", array(), $this->version, 'screen');
	}

    /**
     * Handler for the [simplerotator] shortcode
     */
	function ShortcodeHandler($atts, $content = null) {
	
		// List of supported shortcode attributes and their default values
		$defaults = array(
			'id' => '', // unique ID. If none specified, then it defaults to simplerotaor_x (where x is a unique number)
			'interval' => '5', // seconds
			'transition' => '2', // seconds
			'align' => 'none', // none|left|center|right
			'href' => '',
			'cycles' => 0, // 0=infinite loop, 1 = 1 cycle, 2 = 2 cycles etc
			'startdelay' => 0, // seconds
			'order' => 'normal', // normal|random
			'fullscreen' => false, // true|false
			'width' => 0, // Image width (in pixels). Helps with page rendering. Do not use with a fullscreen rotator
			'height' => 0, // Image height (in pixels). Helps with page rendering. Do not use with a fullscreen rotator
			'shownavigation' => false,  // false|true|onhover
						    // Control the next/previous image navigation feature
 						    // false: no navigation buttons are shown (ie how it is now)
						    // true: always show next/prev navigation buttons (like the simple gallery plugin does)
						    // onhover: only show the next/prev buttons while hovering over the image rotator

			'stoponnavigationclick' => true, // true|false
							 // Only applicable if shownavigation is true|onhover.
							 // true: when the next/previous navigation buttons are clicked, stop the image rotator from automatically rotating
							 // false: don't stop the image rotator after using the navigation buttons
			'hidenavigationduringtransition' => false, // true|false
							 // Only applicable if shownavigation is true|onhover.
							 // Whether or not to show/hide the next/previous buttons while the rotator is transitioning between images.
							 // Particularly relevant when the transition="" parameter is set to high number (ie slow transitions)
							 // true: hide the next/previous navigation buttons during the image transitions
							 // false: don't hide the next/previous navigation buttons during the image transitions. If they are clicked during this period, the request will be ignored.

		    // BEGIN FULL SCREEN ROTATOR PARAMETERS
			'topoffset' => 0, // # of pixels of padding/spacing from the top of the screen
			'rightoffset' => 0, // # of pixels of padding/spacing from the right of the screen
			'bottomoffset' => 0, // # of pixels of padding/spacing from the bottom of the screen
			'leftoffset' => 0, // # of pixels of padding/spacing from the left of the screen
			'losingside' => 'bottom',   // bottom|right
						    // In instances where the image ratio does not match the visitor's screen ratio, one side of the image may be chopped off.
						    // By default the bottom of the image may be chopped, but this parameter can be used chop off the right hand side instead
			'ensurefullscreen' => true // true|false
						    // true:	If whitespace is detected between the losingside of the image and the losingside of the browser,
						    //		increase the image size, potentially chopping off the other side of the image
						    // false:	Don't try and detect whitspace. This maens that the losingside of the image may not take up the full browser dimension
		    // END FULL SCREEN ROTATOR PARAMETERS
		);
		
		$atts = shortcode_atts( $defaults, $atts);
		
		foreach ($atts as $key => $value) {
			$atts[$key] = esc_attr($value);
		}
		
		if (!strlen($content)) return;
		
		if (!empty($href)) {
			$href = esc_url($href, array('http', 'https'));
		}
		
		$images = explode(',', $content);

		$totalnumimages = count($images);
		
		if ($totalnumimages == 0) return;
		
		extract( $atts, EXTR_SKIP );
		
		$interval = absint($interval * 1000);
		$transition = absint($transition * 1000);
		$cycles = absint($cycles);
		$startdelay = absint($startdelay * 1000);
		$topoffset = intval($topoffset);
		$rightoffset = intval($rightoffset);
		$bottomoffset = intval($bottomoffset);
		$leftoffset = intval($leftoffset);
		$width = intval($width);
		$height = intval($height);

		// Can be onhover, true, or false
		if ($shownavigation != 'onhover') {
		    $shownavigation = ($shownavigation == 'true' || $shownavigation == '1') ? 'true' : 'false';
		}
		
		$stoponnavigationclick = ($stoponnavigationclick == 'true' || $stoponnavigationclick == '1') ? 1 : 0;
		$hidenavigationduringtransition = ($hidenavigationduringtransition == 'true' || $hidenavigationduringtransition == '1') ? 1 : 0;

		$fullscreen = ($fullscreen == 'true' || $fullscreen == '1') ? 1 : 0;
		$ensurefullscreen = ($ensurefullscreen == 'true' || $ensurefullscreen == '1') ? 1 : 0;
		
		$additionalCssClasses = '';
		
		$divStyle = '';
		$imgDimensions = '';
		$dimensions = 0;
		
		if (in_array($align, array('left', 'center', 'right'))) {
			$additionalCssClasses .= " align{$align}";
		}
		if (!in_array($losingside, array('bottom', 'right'))) {
			$losingside = $defaults['losingside'];
		}
		
		if ($fullscreen) {
			$additionalCssClasses .= ' fullscreen';
		}
		if (empty($id)) {
			$id = 'simplerotator_' . self::$number;
		}
		
		if ($order == 'random') {
			shuffle($images);
		}
		
		// If this isn't a fullscreen rotator and image width/height has been specified, then hard code them into the HTML <div> and <img> tag instead of calculating it dynamically using JavaScript
		if ( !$fullscreen && $width > 0 && $height > 0 ) {
			$imgDimensions = " width=\"$width\" height=\"$height\"";
			$divStyle = " style=\"width: {$width}px; height: {$height}px;\" ";
			$dimensions = 1;
		}

		// Print out the settings for this rotator
		$html = <<<EOD

<script type="text/javascript">

EOD;

        if ( 1 == self::$number ) {
            // Initialise empty array only when the first shortcode is encountered
            $html .= "var rotatorSettings = []; // Empty settings array\n";
        }
        $html .= <<<EOD
rotatorSettings['$id'] = {
  interval : $interval,
  transition : $transition,
  cycles : $cycles,
  startdelay : $startdelay,
  shownavigation : '$shownavigation',
  stoponnavigationclick : $stoponnavigationclick,
  hidenavigationduringtransition : $hidenavigationduringtransition,
  fullscreen : $fullscreen,
  topoffset : $topoffset,
  rightoffset : $rightoffset,
  bottomoffset : $bottomoffset,
  leftoffset : $leftoffset,
  losingside : '$losingside',
  ensurefullscreen : $ensurefullscreen,
  dimensions : $dimensions,
  totalnumimages : $totalnumimages
}
</script>

EOD;
		$html .= '<div class="simplerotator' . $additionalCssClasses . '" id="' . $id . '"' . $divStyle . ">\n";
		
		if (!empty($href)) {
			$html .= '<a href="' . $href . '">';
		}
		$class = ' class="hidden active first"';
		foreach ($images as $image) {
			$image = trim($image);
			$html .= '    <img src="' . $image . '" alt=""' . $class . $imgDimensions . " />\n";
			$class = ' class="hidden"';
		}

		if (!empty($href)) {
			$html .= '</a>';
		}

		if ($shownavigation == 'onhover' || $shownavigation == 'true') {
		    $html .= '<div class="navigation"></div>';
		}
		
		$html .="</div>\n";
		
		self::$number ++;
		
		return $html;
	}
	
	function SaveInstalledVersion() {
		update_option('om4_simple_rotator_db_version', $this->installedVersion);
	}
	
}

if(defined('ABSPATH') && defined('WPINC')) {
	if (!isset($GLOBALS["om4_Simple_Rotator"])) {
		$GLOBALS["om4_Simple_Rotator"] = new OM4_Simple_Rotator();
	}
}

?>