// Measurement fields for each garment (values in inches)
export const GARMENTS = {
  blouse: {
    label: 'Blouse',
    fields: [
      { key: 'bust', label: 'Bust' },
      { key: 'waist', label: 'Waist' },
      { key: 'shoulder', label: 'Shoulder' },
      { key: 'blouse_length', label: 'Blouse Length' },
      { key: 'sleeve_length', label: 'Sleeve Length' },
      { key: 'sleeve_round', label: 'Sleeve Round' },
      { key: 'armhole', label: 'Armhole' },
      { key: 'front_neck', label: 'Front Neck Depth' },
      { key: 'back_neck', label: 'Back Neck Depth' },
    ],
  },
  kurti: {
    label: 'Kurti',
    fields: [
      { key: 'bust', label: 'Bust' },
      { key: 'waist', label: 'Waist' },
      { key: 'hip', label: 'Hip' },
      { key: 'shoulder', label: 'Shoulder' },
      { key: 'kurti_length', label: 'Kurti Length' },
      { key: 'sleeve_length', label: 'Sleeve Length' },
      { key: 'armhole', label: 'Armhole' },
      { key: 'neck_depth', label: 'Neck Depth' },
    ],
  },
};

export const STATUSES = ['Pending', 'Stitching', 'Ready', 'Delivered'];

export const labelFor = (garment, key) =>
  GARMENTS[garment]?.fields.find((f) => f.key === key)?.label ?? key;
