local function clamp(v, min, max)
    if v < min then return min end
    if v > max then return max end
    return v
end

CreateThread(function()
    while true do
        local ped = PlayerPedId()

        local health, armor = 0, 0

        if DoesEntityExist(ped) then
            local maxHealth = GetEntityMaxHealth(ped)
            local currentHealth = GetEntityHealth(ped)
            local healthBase = math.max(maxHealth - 100, 1)

            health = math.floor(clamp(((currentHealth - 100) / healthBase) * 100.0, 0, 100))
            armor = math.floor(clamp(GetPedArmour(ped), 0, 100))
        end

        local vehicle = GetVehiclePedIsIn(ped, false)
        local inVehicle = vehicle ~= 0 and GetPedInVehicleSeat(vehicle, -1) == ped

        local speed, gear, maxGear, rpm = 0, 0, 0, 0.0
        local turbo = 0.0
        local engineOn, handbrake, nearShift = false, false, false
        local engineHealth = 1000

        if inVehicle then
            speed = math.floor(GetEntitySpeed(vehicle) * 3.6 + 0.5)
            gear = GetVehicleCurrentGear(vehicle)

            if gear == 0 and GetEntitySpeedVector(vehicle, true).y < -0.1 then
                gear = -1
            end

            maxGear = GetVehicleHighGear(vehicle)
            rpm = GetVehicleCurrentRpm(vehicle)
            engineOn = GetIsVehicleEngineRunning(vehicle)
            handbrake = GetVehicleHandbrake(vehicle)
            engineHealth = GetVehicleEngineHealth(vehicle)

            if maxGear < 1 then
                maxGear = math.max(gear, 1)
            end

            if IsToggleModOn(vehicle, 18) then
                local rawTurbo = GetVehicleTurboPressure(vehicle) or 0.0
                turbo = clamp((rpm - 0.6) * 3.5, 0.0, 2.5)
            else
                turbo = 0.0
            end

            nearShift = engineOn and (gear > 0 and gear < maxGear and rpm >= 0.84 and speed > 12)
        end

        SendNUIMessage({
            action = 'hud',
            health = health,
            armor = armor,
            inVehicle = inVehicle,
            turbo = turbo,
            speed = speed,
            gear = gear,
            maxGear = maxGear,
            rpm = rpm,
            engineOn = engineOn,
            nearShift = nearShift,
            handbrake = handbrake,
            engineHealth = engineHealth
        })

        Wait(inVehicle and 50 or 150)
    end
end)