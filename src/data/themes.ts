import { AccentColor } from '../types'

export interface ThemeOption {
  id: AccentColor
  label: string
  /** hex value of the 600-shade, used for swatch previews */
  swatch: string
  /** single-space-separated RGB channels for each Tailwind shade */
  shades: Record<string, string>
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'sky',
    label: 'Sky',
    swatch: '#0284c7',
    shades: {
      '50':  '240 249 255',
      '100': '224 242 254',
      '200': '186 230 253',
      '300': '125 211 252',
      '400': '56 189 248',
      '500': '14 165 233',
      '600': '2 132 199',
      '700': '3 105 161',
      '800': '7 89 133',
      '900': '12 74 110',
      '950': '8 47 73',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    swatch: '#7c3aed',
    shades: {
      '50':  '245 243 255',
      '100': '237 233 254',
      '200': '221 214 254',
      '300': '196 181 253',
      '400': '167 139 250',
      '500': '139 92 246',
      '600': '124 58 237',
      '700': '109 40 217',
      '800': '91 33 182',
      '900': '76 29 149',
      '950': '46 16 101',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    swatch: '#059669',
    shades: {
      '50':  '236 253 245',
      '100': '209 250 229',
      '200': '167 243 208',
      '300': '110 231 183',
      '400': '52 211 153',
      '500': '16 185 129',
      '600': '5 150 105',
      '700': '4 120 87',
      '800': '6 95 70',
      '900': '6 78 59',
      '950': '2 44 34',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    swatch: '#e11d48',
    shades: {
      '50':  '255 241 242',
      '100': '255 228 230',
      '200': '254 205 211',
      '300': '253 164 175',
      '400': '251 113 133',
      '500': '244 63 94',
      '600': '225 29 72',
      '700': '190 18 60',
      '800': '159 18 57',
      '900': '136 19 55',
      '950': '76 5 25',
    },
  },
  {
    id: 'amber',
    label: 'Amber',
    swatch: '#d97706',
    shades: {
      '50':  '255 251 235',
      '100': '254 243 199',
      '200': '253 230 138',
      '300': '252 211 77',
      '400': '251 191 36',
      '500': '245 158 11',
      '600': '217 119 6',
      '700': '180 83 9',
      '800': '146 64 14',
      '900': '120 53 15',
      '950': '69 26 3',
    },
  },
  {
    id: 'pink',
    label: 'Pink',
    swatch: '#db2777',
    shades: {
      '50':  '253 242 248',
      '100': '252 231 243',
      '200': '251 207 232',
      '300': '249 168 212',
      '400': '244 114 182',
      '500': '236 72 153',
      '600': '219 39 119',
      '700': '190 24 93',
      '800': '157 23 77',
      '900': '131 24 67',
      '950': '80 7 36',
    },
  },
]

export function applyAccentColor(accent: AccentColor | undefined): void {
  const theme = THEME_OPTIONS.find((t) => t.id === accent) ?? THEME_OPTIONS[0]
  const root = document.documentElement
  for (const [shade, value] of Object.entries(theme.shades)) {
    root.style.setProperty(`--brand-${shade}`, value)
  }
}
