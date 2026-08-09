# MySQL-Front Dump 2.5
#
# Host: localhost   Database: StreetLights
# --------------------------------------------------------
# Server version 3.23.52-nt

USE StreetLights;


#
# Table structure for table 'accounts_system'
#

DROP TABLE IF EXISTS `accounts_system`;
CREATE TABLE `accounts_system` (
  `id_pc` int(10) unsigned NOT NULL default '0',
  `id_operator` int(10) unsigned NOT NULL default '0',
  `id_message` int(10) unsigned NOT NULL default '0',
  `date_time` datetime NOT NULL default '0000-00-00 00:00:00'
) TYPE=MyISAM;



#
# Table structure for table 'hardwares'
#

DROP TABLE IF EXISTS `hardwares`;
CREATE TABLE `hardwares` (
  `id_hardware` int(10) NOT NULL auto_increment,
  `number_hardware` char(16) NOT NULL default '',
  `city_name` char(30) NOT NULL default '',
  `address_name` char(30) NOT NULL default '',
  `stop` tinyint(3) unsigned NOT NULL default '0',
  `channel` tinyint(2) unsigned NOT NULL default '0',
  `pan_id` decimal(5,0) NOT NULL default '65535',
  `sequrity_key` char(16) NOT NULL default '0123456789ABCDEF',
  `MAC_address` char(16) NOT NULL default '',
  `id_timer` int(10) unsigned NOT NULL default '0',
  `radius_off` tinyint(3) unsigned NOT NULL default '0',
  `lat` decimal(10,6) NOT NULL default '0.000000',
  `lng` decimal(10,6) NOT NULL default '0.000000',
  `resetGPRS_hh` tinyint(3) unsigned NOT NULL default '0',
  `resetGPRS_mm` tinyint(3) unsigned NOT NULL default '0',
  `enable_energy_meter` tinyint(3) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id_hardware`)
) TYPE=MyISAM;



#
# Table structure for table 'lamp_types'
#

DROP TABLE IF EXISTS `lamp_types`;
CREATE TABLE `lamp_types` (
  `id_type_lamp` int(10) unsigned NOT NULL auto_increment,
  `type_name` char(25) NOT NULL default '',
  `power_W` int(5) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id_type_lamp`),
  UNIQUE KEY `id_type_lamp` (`id_type_lamp`)
) TYPE=MyISAM;



#
# Table structure for table 'lamps'
#

DROP TABLE IF EXISTS `lamps`;
CREATE TABLE `lamps` (
  `id_lamp` int(10) unsigned NOT NULL auto_increment,
  `MAC_address` char(16) NOT NULL default '',
  `id_hardware` int(10) unsigned NOT NULL default '0',
  `last_contact` datetime NOT NULL default '0000-00-00 00:00:00',
  `work_hours` int(10) unsigned NOT NULL default '0',
  `street_name` char(30) NOT NULL default '',
  `street_number` char(30) NOT NULL default '',
  `last_test` datetime NOT NULL default '0000-00-00 00:00:00',
  `bit_groups` int(6) unsigned NOT NULL default '3',
  `lat` decimal(10,6) NOT NULL default '0.000000',
  `lng` decimal(10,6) NOT NULL default '0.000000',
  `id_type_lamp` int(10) unsigned NOT NULL default '0',
  `label` char(30) NOT NULL default '',
  PRIMARY KEY  (`id_lamp`)
) TYPE=MyISAM;



#
# Table structure for table 'operators'
#

DROP TABLE IF EXISTS `operators`;
CREATE TABLE `operators` (
  `id_operator` int(10) unsigned NOT NULL auto_increment,
  `name_operator` char(24) NOT NULL default '',
  `password_operator` char(50) NOT NULL default '',
  `privilege` tinyint(3) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id_operator`)
) TYPE=MyISAM;



#
# Table structure for table 'timers'
#

DROP TABLE IF EXISTS `timers`;
CREATE TABLE `timers` (
  `id_timer` int(10) unsigned NOT NULL auto_increment,
  `timer_name` char(30) NOT NULL default '',
  `time_on` int(4) unsigned NOT NULL default '0',
  `time_off` int(4) unsigned NOT NULL default '0',
  `on_g1` int(4) unsigned NOT NULL default '0',
  `off_g1` int(4) unsigned NOT NULL default '0',
  `light_g1` int(3) unsigned NOT NULL default '255',
  `on_g2` int(4) unsigned NOT NULL default '0',
  `off_g2` int(4) unsigned NOT NULL default '0',
  `light_g2` int(3) unsigned NOT NULL default '255',
  `on_g3` int(4) unsigned NOT NULL default '0',
  `off_g3` int(4) unsigned NOT NULL default '0',
  `light_g3` int(3) unsigned NOT NULL default '255',
  `on_g4` int(4) unsigned NOT NULL default '0',
  `off_g4` int(4) unsigned NOT NULL default '0',
  `light_g4` int(3) unsigned NOT NULL default '255',
  `on_g5` int(4) unsigned NOT NULL default '0',
  `off_g5` int(4) unsigned NOT NULL default '0',
  `light_g5` int(3) unsigned NOT NULL default '255',
  `on_g6` int(4) unsigned NOT NULL default '0',
  `off_g6` int(4) unsigned NOT NULL default '0',
  `light_g6` int(3) unsigned NOT NULL default '255',
  `on_g7` int(4) unsigned NOT NULL default '0',
  `off_g7` int(4) unsigned NOT NULL default '0',
  `light_g7` int(3) unsigned NOT NULL default '255',
  `on_g8` int(4) unsigned NOT NULL default '0',
  `off_g8` int(4) unsigned NOT NULL default '0',
  `light_g8` int(3) unsigned NOT NULL default '255',
  `on_g9` int(4) unsigned NOT NULL default '0',
  `off_g9` int(4) unsigned NOT NULL default '0',
  `light_g9` int(3) unsigned NOT NULL default '255',
  `on_g10` int(4) unsigned NOT NULL default '0',
  `off_g10` int(4) unsigned NOT NULL default '0',
  `light_g10` int(3) unsigned NOT NULL default '255',
  `on_g11` int(4) unsigned NOT NULL default '0',
  `off_g11` int(4) unsigned NOT NULL default '0',
  `light_g11` int(3) unsigned NOT NULL default '255',
  `on_g12` int(4) unsigned NOT NULL default '0',
  `off_g12` int(4) unsigned NOT NULL default '0',
  `light_g12` int(3) unsigned NOT NULL default '255',
  `on_g13` int(4) unsigned NOT NULL default '0',
  `off_g13` int(4) unsigned NOT NULL default '0',
  `light_g13` int(3) unsigned NOT NULL default '255',
  `on_g14` int(4) unsigned NOT NULL default '0',
  `off_g14` int(4) unsigned NOT NULL default '0',
  `light_g14` int(3) unsigned NOT NULL default '255',
  `on_g15` int(4) unsigned NOT NULL default '0',
  `off_g15` int(4) unsigned NOT NULL default '0',
  `light_g15` int(3) unsigned NOT NULL default '255',
  `on_g16` int(4) unsigned NOT NULL default '0',
  `off_g16` int(4) unsigned NOT NULL default '0',
  `light_g16` int(3) unsigned NOT NULL default '255',
  `time_on2` int(4) unsigned NOT NULL default '0',
  `time_off2` int(4) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id_timer`)
) TYPE=MyISAM;



#
# Table structure for table 'version'
#

DROP TABLE IF EXISTS `version`;
CREATE TABLE `version` (
  `version` tinyint(3) unsigned NOT NULL default '0',
  `sub_version` tinyint(3) unsigned NOT NULL default '0'
) TYPE=MyISAM;

