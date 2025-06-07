'use client'

import React, { useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { Box, Card, CardContent, Typography, Grid, Chip, Divider, IconButton, CircularProgress } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import MicIcon from '@mui/icons-material/Mic'
import GroupIcon from '@mui/icons-material/Group'

interface Song {
  title: string
  key: string
  description?: string
}

interface Volunteer {
  name: string
  role: string
}

interface ServiceDetailsData {
  songs: Song[]
  volunteers: {
    speakers: Volunteer[]
    vocalists: Volunteer[]
    band: Volunteer[]
  }
}

const ServiceDetails = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<ServiceDetailsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const songs = JSON.parse(searchParams?.get('songs') || '[]') as Song[]

      const volunteers = JSON.parse(
        searchParams?.get('volunteers') || '{"speakers":[],"vocalists":[],"band":[]}'
      ) as ServiceDetailsData['volunteers']

      setData({ songs, volunteers })
    } catch (error) {
      console.error('Error parsing service details data:', error)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) {
    return (
      <Box sx={{ p: 4 }}>
        <IconButton onClick={handleBack} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography color='error'>Error loading service details</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 4 }}>
      <IconButton onClick={handleBack} sx={{ mb: 2 }}>
        <ArrowBackIcon />
      </IconButton>

      <Grid container spacing={4}>
        {/* Songs Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MusicNoteIcon sx={{ mr: 1 }} /> Songs
              </Typography>
              <Box component='ul' sx={{ pl: 2 }}>
                {data.songs.map((song, index) => (
                  <Box component='li' key={index} sx={{ mb: 2 }}>
                    <Typography variant='body1'>
                      <strong>{song.title}</strong>
                      {song.key && <span> – Key: {song.key}</span>}
                      {song.description && <span> ({song.description})</span>}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Volunteers Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon sx={{ mr: 1 }} /> Volunteers
              </Typography>

              {/* Speakers */}
              <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MicIcon sx={{ mr: 1 }} /> Speakers
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {data.volunteers.speakers.map((speaker, index) => (
                    <Chip key={index} label={speaker.name} color='primary' variant='outlined' />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Vocalists */}
              <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MusicNoteIcon sx={{ mr: 1 }} /> Vocalists
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {data.volunteers.vocalists.map((vocalist, index) => (
                    <Chip key={index} label={vocalist.name} color='secondary' variant='outlined' />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Band */}
              <Box>
                <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GroupIcon sx={{ mr: 1 }} /> Band
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {data.volunteers.band.map((member, index) => (
                    <Chip key={index} label={member.name} color='info' variant='outlined' />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ServiceDetails
