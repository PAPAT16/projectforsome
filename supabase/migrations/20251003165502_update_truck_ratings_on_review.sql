/*
  # Update Food Truck Ratings Automatically

  ## Changes
  1. Create function to calculate and update truck ratings
  2. Create trigger to run after review insert/update/delete
  3. Update existing trucks with current review stats

  ## Purpose
  - Automatically calculate average_rating and total_reviews
  - Keep truck ratings in sync with reviews
  - Enable featured trucks section to work properly
*/

-- Function to update food truck rating statistics
CREATE OR REPLACE FUNCTION update_food_truck_ratings()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_truck_id uuid;
BEGIN
  -- Determine which truck to update
  IF TG_OP = 'DELETE' THEN
    v_truck_id := OLD.food_truck_id;
  ELSE
    v_truck_id := NEW.food_truck_id;
  END IF;

  -- Update the food truck's rating statistics
  UPDATE food_trucks
  SET 
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE food_truck_id = v_truck_id
    ), 0),
    total_reviews = COALESCE((
      SELECT COUNT(*)
      FROM reviews
      WHERE food_truck_id = v_truck_id
    ), 0),
    updated_at = now()
  WHERE id = v_truck_id;

  RETURN NULL;
END;
$$;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS update_ratings_on_review_insert ON reviews;
CREATE TRIGGER update_ratings_on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_food_truck_ratings();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS update_ratings_on_review_update ON reviews;
CREATE TRIGGER update_ratings_on_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_food_truck_ratings();

-- Create trigger for DELETE
DROP TRIGGER IF EXISTS update_ratings_on_review_delete ON reviews;
CREATE TRIGGER update_ratings_on_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_food_truck_ratings();

-- Update all existing food trucks with their current ratings
UPDATE food_trucks ft
SET 
  average_rating = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews r
    WHERE r.food_truck_id = ft.id
  ), 0),
  total_reviews = COALESCE((
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.food_truck_id = ft.id
  ), 0),
  updated_at = now();
