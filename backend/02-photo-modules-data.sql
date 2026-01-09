-- =============================================
-- BRAXON PHOTO MODULES - MODULE DATA
-- File: 02-photo-modules-data.sql
-- =============================================

-- 1. ANTENNA INSTALLATION
INSERT INTO installation_modules (name, description, category, display_order) 
VALUES ('Antenna Installation', 'Antenna mounting and installation', 'equipment', 1);

INSERT INTO photo_checklist_items (installation_module_id, item_name, required_photo_count, display_order) VALUES
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Overall of back of antenna', 1, 1),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Antenna model number', 1, 2),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Antenna RAD Center', 1, 3),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Feedhorn hardware (showing complete)', 1, 4),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Feedhorn level', 1, 5),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Pipe-mount level and plumb', 1, 6),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Pipe-mount (overall, top, and bottom)', 3, 7),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Inboard side strut', 2, 8),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Outboard side strut', 2, 9),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Outboard side strut #2', 2, 10),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Azimuth photo (from above the antenna)', 1, 11),
((SELECT id FROM installation_modules WHERE name = 'Antenna Installation'), 'Additional photos', 5, 12);

-- 2. WAVEGUIDE INSTALLATION
INSERT INTO installation_modules (name, description, category, display_order) 
VALUES ('Waveguide Installation', 'Waveguide runs and connections', 'cable', 2);

INSERT INTO photo_checklist_items (installation_module_id, item_name, required_photo_count, display_order) VALUES
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Waveguide connector', 1, 1),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Antenna feed support', 1, 2),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Waveguide run to the antenna', 1, 3),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Waveguide run from cable ladder to antenna', 3, 4),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Hoisting grip', 1, 5),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Top ground', 2, 6),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Waveguide going down the cable ladder', 1, 7),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Waveguide going up the cable ladder', 1, 8),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Bottom ground', 2, 9),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Cable ladder to ice bridge transition', 1, 10),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Ice bridge run', 3, 11),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Entry port ground', 1, 12),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Entry port sealed', 1, 13),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Interior installation', 3, 14),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Flex Twist (showing Pressure Window)', 1, 15),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Dehydrator overall', 1, 16),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Manifold showing pressure and label', 1, 17),
((SELECT id FROM installation_modules WHERE name = 'Waveguide Installation'), 'Additional photos', 5, 18);

-- 3. ODU INSTALLATION
INSERT INTO installation_modules (name, description, category, display_order) 
VALUES ('ODU Installation', 'Outdoor unit installation', 'equipment', 3);

INSERT INTO photo_checklist_items (installation_module_id, item_name, required_photo_count, display_order) VALUES
((SELECT id FROM installation_modules WHERE name = 'ODU Installation'), 'Overall ODU Installation', 2, 1),
((SELECT id FROM installation_modules WHERE name = 'ODU Installation'), 'ODU ground', 2, 2),
((SELECT id FROM installation_modules WHERE name = 'ODU Installation'), 'Flex twist', 1, 3),
((SELECT id FROM installation_modules WHERE name = 'ODU Installation'), 'Cable support at ODU', 1, 4),
((SELECT id FROM installation_modules WHERE name = 'ODU Installation'), 'Additional photos', 5, 5);

-- 4. HYBRID OR COAX/FIBER
INSERT INTO installation_modules (name, description, category, display_order) 
VALUES ('Hybrid or Coax/Fiber', 'Hybrid cable or coax/fiber runs', 'cable', 4);

INSERT INTO photo_checklist_items (installation_module_id, item_name, required_photo_count, display_order) VALUES
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Cable @ ODU (showing last support)', 1, 1),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Service loop (with supports)', 1, 2),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Cable from ODU to Cable Ladder', 3, 3),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Hoisting Grip', 1, 4),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Top Ground', 2, 5),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Cable going down Cable Ladder', 1, 6),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Cable Going up Cable Ladder', 1, 7),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Bottom Ground', 1, 8),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Cable Ladder to Ice Bridge Transition (showing drip loop)', 1, 9),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Ice Bridge Run', 3, 10),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Entry port ground or polyphaser', 2, 11),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Entry port sealed', 1, 12),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Interior installation', 3, 13),
((SELECT id FROM installation_modules WHERE name = 'Hybrid or Coax/Fiber'), 'Additional photos', 5, 14);

-- 5. ICE SHIELD
INSERT INTO installation_modules (name, description, category, display_order) 
VALUES ('Ice Shield', 'Ice shield installation', 'equipment', 5);

INSERT INTO photo_checklist_items (installation_module_id, item_name, required_photo_count, display_order) VALUES
((SELECT id FROM installation_modules WHERE name = 'Ice Shield'), 'Overall Ice Shield', 2, 1),
((SELECT id FROM installation_modules WHERE name = 'Ice Shield'), 'Pipe-mount level and plumb', 1, 2),
((SELECT id FROM installation_modules WHERE name = 'Ice Shield'), 'Pipe-mount (overall, top, and bottom)', 3, 3),
((SELECT id FROM installation_modules WHERE name = 'Ice Shield'), 'Guyed wire installation', 3, 4),
((SELECT id FROM installation_modules WHERE name = 'Ice Shield'), 'Additional photos', 5, 5);

-- 6. RADIO INSTALLATION
INSERT INTO installation_modules (name, description, category, display_order) 
VALUES ('Radio Installation', 'Radio equipment installation', 'equipment', 6);

INSERT INTO photo_checklist_items (installation_module_id, item_name, required_photo_count, display_order) VALUES
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'Overall Front of Rack', 1, 1),
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'Overall Back of Rack', 1, 2),
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'Front of Microwave Radio (overall, left side, right side)', 3, 3),
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'Front of Transceiver', 8, 4),
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'Cable installation front and back', 4, 5),
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'Fuse Panel Open and Labeled (overall, left side, right side)', 3, 6),
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'DC Cables from Fuse Panel to Rectifier (showing labels)', 4, 7),
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'Rectifier breakers with labels', 2, 8),
((SELECT id FROM installation_modules WHERE name = 'Radio Installation'), 'Additional photos', 5, 9);

-- 7. OVERALL PHOTOS (FROM GROUND)
INSERT INTO installation_modules (name, description, category, display_order) 
VALUES ('Overall Photos (from ground)', 'Site overview photos', 'documentation', 7);

INSERT INTO photo_checklist_items (installation_module_id, item_name, required_photo_count, display_order) VALUES
((SELECT id FROM installation_modules WHERE name = 'Overall Photos (from ground)'), 'Overall of tower from the ground at back azimuth', 1, 1),
((SELECT id FROM installation_modules WHERE name = 'Overall Photos (from ground)'), 'Antenna installation at Back Azimuth (zoomed in, showing antenna label)', 1, 2),
((SELECT id FROM installation_modules WHERE name = 'Overall Photos (from ground)'), 'Antenna installation from 90 degrees to the right (zoomed in)', 1, 3),
((SELECT id FROM installation_modules WHERE name = 'Overall Photos (from ground)'), 'Antenna installation from 90 degrees to the left (zoomed in)', 1, 4),
((SELECT id FROM installation_modules WHERE name = 'Overall Photos (from ground)'), 'Overall compound showing cleanliness', 3, 5),
((SELECT id FROM installation_modules WHERE name = 'Overall Photos (from ground)'), 'Equipment door closed', 1, 6),
((SELECT id FROM installation_modules WHERE name = 'Overall Photos (from ground)'), 'Compound gate closed', 1, 7),
((SELECT id FROM installation_modules WHERE name = 'Overall Photos (from ground)'), 'Site placard', 2, 8);

-- 8. MISC PHOTOS
INSERT INTO installation_modules (name, description, category, display_order) 
VALUES ('Misc. Photos', 'Miscellaneous documentation', 'documentation', 8);

INSERT INTO photo_checklist_items (installation_module_id, item_name, required_photo_count, display_order) VALUES
((SELECT id FROM installation_modules WHERE name = 'Misc. Photos'), 'Misc photos', 10, 1);

-- Output success message
SELECT 'Module data inserted successfully!' as status;
SELECT 
  (SELECT COUNT(*) FROM installation_modules) as modules_created,
  (SELECT COUNT(*) FROM photo_checklist_items) as checklist_items_created;