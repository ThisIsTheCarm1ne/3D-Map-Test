// Component that shows information of selected building(s)
// Takes list of features as prop

import { GeoJSONFeature } from "mapbox-gl"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface IProps {
  features: GeoJSONFeature[] | null
}

export default function BuildingInfo(
  { features }: IProps
) {

  if (features === null) {
    return null;
  }

  return (
    <div className="flex gap-3">
      {features.map((feature, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{feature.properties.name || 'Unnamed Building'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Type: {feature.properties.type || 'No type'}</p>
          </CardContent>
          <CardContent>
            <p>Address: {feature.properties.address || 'No address'}</p>
          </CardContent>
          <CardContent>
            <p>Height: {feature.properties.height || 'No Height'}m</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
