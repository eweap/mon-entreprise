import React from 'react'
import styled from 'styled-components'
import RuleLink from 'Components/RuleLink'
import { capitalise0 } from '../utils'

const BarStack = styled.div`
	display: flex;
	border-radius: 0.4em;
	overflow: hidden;
`

const BarItem = styled.div`
	height: 26px;
	border-right: 2px solid white;

	&:last-child {
		border-right: none;
	}
`

const BarStackLegend = styled.div`
	display: flex;
	margin-top: 10px;
	flex-direction: column;

	@media (min-width: 800px) {
		flex-direction: row;
		text-align: center;
	}
`

const BarStackLegendItem = styled.div`
	flex: 1 1 0px;
	color: #555;

	strong {
		display: inline-block;
		color: #111;
		margin-left: 8px;
	}
`

const SmallCircle = styled.span`
	display: inline-block;
	height: 11px;
	width: 11px;
	margin-right: 10px;
	border-radius: 100%;
`

function integerAndDecimalParts(value) {
	const integer = Math.floor(value)
	const decimal = value - integer
	return { integer, decimal }
}

// This function calculates rounded percentages so that the sum of all
// returned values is always 100. For instance: [60, 30, 10].
export function roundedPercentages(values) {
	const sum = (a = 0, b) => a + b
	const total = values.reduce(sum)
	const percentages = values.map(value =>
		integerAndDecimalParts((value / total) * 100)
	)
	const totalRoundedPercentage = percentages.map(v => v.integer).reduce(sum)
	const indexesToIncrement = percentages
		.map((percentage, index) => ({ ...percentage, index }))
		.sort((a, b) => b.decimal - a.decimal)
		.map(({ index }) => index)
		.splice(0, 100 - totalRoundedPercentage)

	return percentages.map(
		({ integer }, index) =>
			integer + (indexesToIncrement.includes(index) ? 1 : 0)
	)
}

export default function StackedBarChart({ data }) {
	const percentages = roundedPercentages(data.map(d => d.nodeValue))
	const dataWithPercentage = data.map((data, index) => ({
		...data,
		percentage: percentages[index]
	}))

	return (
		<>
			<BarStack>
				{dataWithPercentage.map(({ dottedName, color, percentage }) => (
					<BarItem
						style={{
							width: `${percentage}%`,
							backgroundColor: color || 'green'
						}}
						key={dottedName}
					/>
				))}
			</BarStack>
			<BarStackLegend>
				{dataWithPercentage.map(({ percentage, color, ...rule }) => (
					<BarStackLegendItem key={rule.dottedName}>
						<SmallCircle style={{ backgroundColor: color }} />
						<RuleLink {...rule}>{capitalise0(rule.name)}</RuleLink>
						<strong>{percentage} %</strong>
					</BarStackLegendItem>
				))}
			</BarStackLegend>
		</>
	)
}
