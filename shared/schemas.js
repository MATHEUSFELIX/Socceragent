/*
 * Shared Zod schemas for validating request and response payloads between
 * the frontend and backend. These schemas can be imported on both sides to
 * enforce type safety. For demonstration purposes we include a few basic
 * schemas; you can extend them to cover all API endpoints.
 */

const { z } = require('zod');

// Schema for match analysis request
const AnalysisRequestSchema = z.object({
  coach: z.string().min(1),
  opponent: z.string().min(1),
  squad: z.array(z.any()).optional(),
  context: z.string().optional(),
});

// Schema for match simulation request
const SimulationRequestSchema = z.object({
  coach: z.string().min(1),
  opponent: z.string().min(1),
  lineup: z.array(z.any()),
  instructions: z.any().optional(),
});

// Schema for world cup session request
const WorldCupRequestSchema = z.object({
  year: z.number().int().positive(),
  coach: z.string().min(1),
  selectedPlayers: z.array(z.string()).optional(),
});

module.exports = {
  AnalysisRequestSchema,
  SimulationRequestSchema,
  WorldCupRequestSchema,
};