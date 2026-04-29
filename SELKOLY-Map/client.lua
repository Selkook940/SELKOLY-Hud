local minimap = RequestScaleformMovie("minimap")

Citizen.CreateThread(function()
    while true do
        Wait(1500)
        if Config.Hidemapoutsidecar then
          if Config.Hidemapwhenengineoff then
            local player = PlayerPedId()
            local vehicle = GetVehiclePedIsIn(player, false)
            local vehicleIsOn = GetIsVehicleEngineRunning(vehicle)
            if IsPedInAnyVehicle(player, false) and vehicleIsOn then
                ToggleRadar(true)
                SendNUIMessage({mapoutline = true})
                TriggerVehicleLoop()
            else
                ToggleRadar(false)
                SendNUIMessage({mapoutline = false})
                SetRadarZoom(1150)
            end
          else
            local player = PlayerPedId()
            if IsPedInAnyVehicle(player, false) then
                ToggleRadar(true)
                SendNUIMessage({mapoutline = true})
                TriggerVehicleLoop()
            else
                ToggleRadar(false)
                SendNUIMessage({mapoutline = false})
                SetRadarZoom(1150)
            end
          end
        else
            break
        end
    end
end)

Citizen.CreateThread(function()
	-- Coordenadas
    local x = 0.004
    local y = -0.07
    local w = 0.16
    local h = 0.25

    local minimap = RequestScaleformMovie("minimap")
    RequestStreamedTextureDict("circlemap", false)
    while not HasStreamedTextureDictLoaded("circlemap") do Wait(1000) end
    AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "circlemap",
                      "radarmasksm")

    SetMinimapClipType(1)
    SetMinimapComponentPosition('minimap', 'L', 'B', x, y, w, h)
    SetMinimapComponentPosition('minimap_mask', 'L', 'B', x + 0.17, y + 0.09,
                                0.072, 0.162)
    SetMinimapComponentPosition('minimap_blur', 'L', 'B', -0.006, -0.084, 0.18,
                                0.22)
    Wait(0)
    SetRadarBigmapEnabled(true, false)
    Wait(0)
    SetRadarBigmapEnabled(false, false)

    while true do
        Wait(0)
        BeginScaleformMovieMethod(minimap, "SETUP_HEALTH_ARMOUR")
        ScaleformMovieMethodAddParamInt(3)
        EndScaleformMovieMethod()
        BeginScaleformMovieMethod(minimap, 'HIDE_SATNAV')
        EndScaleformMovieMethod()
    end
end)

CreateThread(function()
    while true do
        Wait(2000)
        SetRadarZoom(1150)
	end
end)
