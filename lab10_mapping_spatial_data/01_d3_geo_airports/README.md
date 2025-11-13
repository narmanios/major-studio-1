
# D3 Geo Projections: Core vs Extended

D3 has two separate packages for projections:

## d3-geo (bundled in d3.js) - Core projections only:

- `geoAlbers`
- `geoAzimuthalEqualArea`
- `geoAzimuthalEquidistant`
- `geoConicConformal`
- `geoConicEqualArea`
- `geoConicEquidistant`
- `geoEqualEarth`
- `geoEquirectangular`
- `geoGnomonic`
- `geoMercator`
- `geoNaturalEarth1`
- `geoOrthographic`
- `geoStereographic`
- `geoTransverseMercator`

## d3-geo-projection (separate package) - Extended projections:

- `geoHammerRetroazimuthal` ← Your selection
- Plus 100+ other specialized projections

## Why the split?

- **Bundle size**: Most people only need common projections
- **Performance**: Core library stays lightweight
- **Use case**: Exotic projections are needed rarely

## To use geoHammerRetroazimuthal:

```bash
npm install d3-geo-projection
```

```javascript
import { geoHammerRetroazimuthal } from 'd3-geo-projection';
```

Or via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/d3-geo-projection@4"></script>
```

## Without the extended library:

```javascript
d3.geoHammerRetroazimuthal is not a function
```
