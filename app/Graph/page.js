"use client";

import React from 'react'
import { useEffect, useMemo, useState, useTransition } from "react"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, usePlotArea } from "recharts"
import { useRouter } from "next/navigation"

function getModColor(rank) {
  const rankColors = {
    "KNIGHT": "#ef4444",
    "VANGUARD_KNIGHT": "#8B0000",
    "GENERAL": "#06b6d4",
    "SUPREME_GENERAL": "#01889c",
    "RECRUIT": "#eab308",
    "COMMANDER": "#dc2626",
    "PRIME_COMMANDER": "#b91c1c",
  }
  return rankColors[rank] || "#6b7280"
}

const RANK_GROUPS = {
  "KNIGHT": ["KNIGHT", "VANGUARD_KNIGHT"],
  "COMMANDER": ["COMMANDER", "PRIME_COMMANDER"],
  "GENERAL": ["GENERAL", "SUPREME_GENERAL"],
  "RECRUIT": ["RECRUIT"],
}

const MINUTES_PER_DAY = 1440

function formatLocalMinute(minute) {
  const hour = Math.floor(minute / 60) % 24
  const minutes = minute % 60
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function shiftGraphToLocalTime(graph, utcOffsetMinutes) {
  return graph
    .flatMap(segment => {
      const duration = segment.end_minute - segment.start_minute
      const localStart =
        (segment.start_minute + utcOffsetMinutes + MINUTES_PER_DAY) %
        MINUTES_PER_DAY
      const localEnd = localStart + duration

      if (localEnd <= MINUTES_PER_DAY) {
        return [{ ...segment, start_minute: localStart, end_minute: localEnd }]
      }

      return [
        { ...segment, start_minute: localStart, end_minute: MINUTES_PER_DAY },
        {
          ...segment,
          start_minute: 0,
          end_minute: localEnd - MINUTES_PER_DAY,
        },
      ]
    })
    .sort((first, second) => first.start_minute - second.start_minute)
}

function transformData(rawData, allMods) {
  const points = rawData.map(slot => {
    const activeMods = new Set(slot.active_mods)
    const entry = {
      minute: slot.start_minute,
    }
    allMods.forEach(mod => {
      entry[mod] = activeMods.has(mod) ? 1 : 0
    })
    return entry
  })

  const lastSlot = rawData.at(-1)
  if (lastSlot && lastSlot.end_minute < 1440) {
    points.push({
      ...points.at(-1),
      minute: lastSlot.end_minute,
    })
  } else if (lastSlot && lastSlot.end_minute === 1440) {
    points.push({
      ...points.at(-1),
      minute: 1440,
    })
  }

  return points
}

function findActiveMods(graph, minute) {
  let low = 0
  let high = graph.length - 1

  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const slot = graph[middle]
    if (minute < slot.start_minute) {
      high = middle - 1
    } else if (minute >= slot.end_minute) {
      low = middle + 1
    } else {
      return slot.active_mods
    }
  }

  return []
}

function CoverageBars({ graph, visibleMods, modRanks }) {
  const plotArea = usePlotArea()
  if (!plotArea || graph.length === 0) return null

  const segments = graph.map(segment => ({
    ...segment,
    activeMods: visibleMods.filter(mod => segment.active_mods.includes(mod)),
  }))
  const maxCount = Math.max(1, ...segments.map(segment => segment.activeMods.length))
  const rowHeight = plotArea.height / maxCount

  return segments.flatMap(segment => {
    if (segment.activeMods.length === 0) return []
    const fullWidth =
      ((segment.end_minute - segment.start_minute) / 1440) * plotArea.width
    const gap = Math.min(2, Math.max(0, fullWidth - 1))
    const width = fullWidth - gap
    const x =
      plotArea.x +
      (segment.start_minute / 1440) * plotArea.width +
      gap / 2

    return segment.activeMods.map((mod, index) => (
      <rect
        key={`${segment.start_minute}-${mod}`}
        x={x}
        y={plotArea.y + plotArea.height - (index + 1) * rowHeight}
        width={width}
        height={rowHeight}
        fill={getModColor(modRanks[mod])}
        shapeRendering="crispEdges"
        pointerEvents="none"
      />
    ))
  })
}

function MinuteHoverLayer({ graph, visibleMods, modRanks, deviceTimezone }) {
  const plotArea = usePlotArea()
  const [hoveredMinute, setHoveredMinute] = useState(null)

  if (!plotArea || graph.length === 0) return null

  const activeMods = hoveredMinute === null
    ? []
    : findActiveMods(graph, hoveredMinute).filter(mod => visibleMods.includes(mod))
  const tooltipWidth = 200
  const tooltipHeight = Math.min(64 + activeMods.length * 22, 240)
  const cursorX = plotArea.x + ((hoveredMinute ?? 0) / 1440) * plotArea.width
  const tooltipX = Math.max(
    plotArea.x,
    Math.min(cursorX + 12, plotArea.x + plotArea.width - tooltipWidth),
  )

  return (
    <>
      <rect
        x={plotArea.x}
        y={plotArea.y}
        width={plotArea.width}
        height={plotArea.height}
        fill="transparent"
        className="graph-touch-layer"
        onPointerDown={event => {
          if (event.pointerType !== "touch") return

          event.currentTarget.setPointerCapture(event.pointerId)
          const bounds = event.currentTarget.getBoundingClientRect()
          const minute = Math.min(
            1439,
            Math.floor(((event.clientX - bounds.left) / bounds.width) * 1440),
          )
          setHoveredMinute(minute)
        }}
        onPointerMove={event => {
          const bounds = event.currentTarget.getBoundingClientRect()
          const minute = Math.min(
            1439,
            Math.floor(((event.clientX - bounds.left) / bounds.width) * 1440),
          )
          setHoveredMinute(previous => previous === minute ? previous : minute)
        }}
        onPointerLeave={event => {
          if (event.pointerType !== "touch") setHoveredMinute(null)
        }}
      />
      {hoveredMinute !== null && (
        <>
          <line
            x1={cursorX}
            x2={cursorX}
            y1={plotArea.y}
            y2={plotArea.y + plotArea.height}
            stroke="#374151"
            strokeDasharray="3 3"
            pointerEvents="none"
          />
          <foreignObject
            x={tooltipX}
            y={plotArea.y + 8}
            width={tooltipWidth}
            height={tooltipHeight}
            pointerEvents="none"
          >
            <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-lg">
              <p className="mb-2 font-semibold text-gray-700">
                {formatLocalMinute(hoveredMinute)} {deviceTimezone}
              </p>
              {activeMods.length === 0 ? (
                <p className="text-gray-400">No mods active</p>
              ) : (
                <>
                  <p className="mb-2 text-xs text-gray-400">
                    {activeMods.length} mod{activeMods.length === 1 ? "" : "s"} active
                  </p>
                  {activeMods.map(mod => (
                    <div key={mod} className="mb-1 flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ background: getModColor(modRanks[mod]) }}
                      />
                      <span className="font-medium text-gray-700">{mod}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </foreignObject>
        </>
      )}
    </>
  )
}

export default function Graph() {
  const [rawGraph, setRawGraph] = useState([])
  const [allMods, setAllMods] = useState([])
  const [modRanks, setModRanks] = useState({})
  const [selectedMods, setSelectedMods] = useState([])
  const [selectedRanks, setSelectedRanks] = useState([])
  const [loadError, setLoadError] = useState("")
  const [deviceTimezone, setDeviceTimezone] = useState("")
  const [utcOffsetMinutes, setUtcOffsetMinutes] = useState(0)
  const [, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const updateDeviceTimezone = () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const offsetMinutes = -new Date().getTimezoneOffset()

      setDeviceTimezone(previous =>
        previous === timezone ? previous : timezone,
      )
      setUtcOffsetMinutes(previous =>
        previous === offsetMinutes ? previous : offsetMinutes,
      )
    }

    updateDeviceTimezone()
    window.addEventListener("focus", updateDeviceTimezone)
    const intervalId = window.setInterval(updateDeviceTimezone, 60_000)

    return () => {
      window.removeEventListener("focus", updateDeviceTimezone)
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    async function fetchAll() {
      try {
        const response = await fetch(
          "/api/graph_data?slot_size=1&include_moderators=true",
        )
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Could not load moderator data");
        }

        const rankMap = {}
        result.moderators.forEach(mod => {
          rankMap[mod.name] = mod.rank.toUpperCase().replace(/ /g, "_")
        })
        setModRanks(rankMap)

        const modNames = [...new Set(result.graph.flatMap(slot => slot.active_mods))]
        setAllMods(modNames)
        setSelectedMods(modNames)
        setRawGraph(result.graph)
      } catch (error) {
        setLoadError(error.message || "Could not load moderator data")
      }
    }
    fetchAll()
  }, [])

  const visibleMods = useMemo(() => {
    const selectedModSet = new Set(selectedMods)
    const selectedRankSet = new Set(selectedRanks)
    return allMods.filter(mod =>
      selectedModSet.has(mod) &&
      (selectedRankSet.size === 0 || selectedRankSet.has(modRanks[mod]))
    )
  }, [allMods, modRanks, selectedMods, selectedRanks])

  const maxVisibleCount = useMemo(
    () =>
      Math.max(
        1,
        ...rawGraph.map(
          slot => slot.active_mods.filter(mod => visibleMods.includes(mod)).length,
        ),
      ),
    [rawGraph, visibleMods],
  )

  const graphData = useMemo(
    () => transformData(rawGraph, allMods),
    [rawGraph, allMods],
  )

  const localGraph = useMemo(
    () => shiftGraphToLocalTime(rawGraph, utcOffsetMinutes),
    [rawGraph, utcOffsetMinutes],
  )

  const toggleMod = (mod) => {
    startTransition(() => {
      setSelectedMods(prev =>
        prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
      )
    })
  }

  const toggleRank = (groupName) => {
    const ranksInGroup = RANK_GROUPS[groupName]
    const allSelected = ranksInGroup.every(r => selectedRanks.includes(r))
    startTransition(() => {
      if (allSelected) {
        setSelectedRanks(prev => prev.filter(r => !ranksInGroup.includes(r)))
      } else {
        setSelectedRanks(prev => [...new Set([...prev, ...ranksInGroup])])
      }
    })
  }

  const presentRankGroups = Object.keys(RANK_GROUPS).filter(group =>
    RANK_GROUPS[group].some(rank =>
      allMods.some(mod => modRanks[mod] === rank)
    )
  )
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 py-6 sm:py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Moderator coverage</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Times shown in {deviceTimezone || "your device timezone"}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-xs sm:text-sm font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
        >
          ← Back
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allMods.map(mod => (
          <div key={mod} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getModColor(modRanks[mod]) }} />
            {mod}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow p-4 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter by mod</p>
          <div className="flex flex-wrap gap-2">
            {allMods.map(mod => (
              <button
                key={mod}
                type="button"
                onClick={() => toggleMod(mod)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                  selectedMods.includes(mod)
                    ? "text-white border-transparent"
                    : "bg-white text-gray-400 border-gray-200"
                }`}
                style={selectedMods.includes(mod) ? { background: getModColor(modRanks[mod]), borderColor: getModColor(modRanks[mod]) } : {}}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow p-4 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter by rank</p>
          <div className="flex flex-wrap gap-2">
            {presentRankGroups.map(group => {
              const isActive = RANK_GROUPS[group].some(r => selectedRanks.includes(r))
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => toggleRank(group)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                    isActive ? "text-white border-transparent" : "bg-white text-gray-400 border-gray-200"
                  }`}
                  style={isActive ? { background: getModColor(group), borderColor: getModColor(group) } : {}}
                >
                  {group.replace(/_/g, " ")}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-4 sm:p-6">
        {loadError && (
          <p role="alert" className="py-8 text-center text-sm text-red-600">
            {loadError}
          </p>
        )}
        <div className="overflow-x-auto">
          <div style={{ minWidth: "1400px" }}>
            <div
              className="flex h-8 items-center px-3 text-xs text-gray-400"
              style={{ touchAction: "pan-x" }}
            >
              Swipe here to scroll the graph
            </div>
            <ResponsiveContainer width="100%" height={500}>
              <AreaChart
                data={graphData}
                margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="minute"
                  type="number"
                  domain={[0, 1440]}
                  tickCount={25}
                  tickFormatter={minute => formatLocalMinute(minute)}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, maxVisibleCount]}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Mods active", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 11, fill: "#9ca3af" } }}
                />
                <CoverageBars
                  graph={localGraph}
                  visibleMods={visibleMods}
                  modRanks={modRanks}
                />
                <MinuteHoverLayer
                  graph={localGraph}
                  visibleMods={visibleMods}
                  modRanks={modRanks}
                  deviceTimezone={deviceTimezone}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div
              className="h-8"
              aria-hidden="true"
              style={{ touchAction: "pan-x" }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}